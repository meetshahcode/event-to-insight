package database

import (
	"database/sql"
	"encoding/json"
	"event-to-insight/internal/models"
	"fmt"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// SQLiteDB implements DatabaseInterface for SQLite
type SQLiteDB struct {
	db *sql.DB
}

// NewSQLiteDB creates a new SQLite database instance
func NewSQLiteDB(dbPath string) (*SQLiteDB, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Enable foreign key constraints
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return nil, fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	sqliteDB := &SQLiteDB{db: db}
	return sqliteDB, nil
}

// Initialize creates the database tables and seeds initial data
func (s *SQLiteDB) Initialize() error {
	if err := s.createTables(); err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	if err := s.seedArticles(); err != nil {
		return fmt.Errorf("failed to seed articles: %w", err)
	}

	return nil
}

// createTables creates the necessary database tables
func (s *SQLiteDB) createTables() error {
	schema := `
	CREATE TABLE IF NOT EXISTS articles (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		content TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS queries (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		query TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS search_results (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		query_id INTEGER NOT NULL,
		ai_summary_answer TEXT NOT NULL,
		ai_relevant_articles TEXT NOT NULL, -- JSON array
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (query_id) REFERENCES queries(id)
	);
	`

	_, err := s.db.Exec(schema)
	return err
}

// seedArticles populates the database with initial articles
func (s *SQLiteDB) seedArticles() error {
	// Check if articles already exist
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM articles").Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil // Articles already seeded
	}

	articles := []models.Article{
		{
			Title:   "Password Reset Instructions",
			Content: "To reset your password: 1) Go to the login page 2) Click 'Forgot Password' 3) Enter your email address 4) Check your email for reset instructions 5) Follow the link and create a new password. The reset link expires in 24 hours.",
		},
		{
			Title:   "VPN Connection Setup",
			Content: "Setting up VPN connection: 1) Download the VPN client from the IT portal 2) Install using admin credentials 3) Use your domain username and password 4) Connect to the 'Corporate-Main' server 5) Verify connection by accessing internal resources. Contact IT if you experience connectivity issues.",
		},
		{
			Title:   "Software Installation Guidelines",
			Content: "For software installation: 1) Check the approved software list on the IT portal 2) Submit a software request ticket if not approved 3) Admin rights are required for installation 4) IT will remotely install if you don't have admin access 5) All installations must be from official vendors only.",
		},
		{
			Title:   "Email Configuration Troubleshooting",
			Content: "Email setup issues: 1) Verify server settings - IMAP: mail.company.com port 993 SSL, SMTP: mail.company.com port 587 STARTTLS 2) Check username format: firstname.lastname@company.com 3) Ensure password is current 4) Clear email cache and restart client 5) For mobile devices, use app-specific passwords.",
		},
		{
			Title:   "Multi-Factor Authentication Setup",
			Content: "MFA setup process: 1) Install Microsoft Authenticator app 2) Log into company portal 3) Navigate to Security Settings 4) Click 'Add Authentication Method' 5) Scan QR code with authenticator app 6) Enter verification code 7) MFA is now required for all company logins.",
		},
		{
			Title:   "Printer Connection Issues",
			Content: "Printer troubleshooting: 1) Ensure printer is connected to corporate network 2) Install latest printer drivers from manufacturer website 3) Add printer using IP address: 192.168.1.100 4) Check print queue for stuck jobs 5) Restart print spooler service if needed 6) For Mac users, use CUPS interface.",
		},
		{
			Title:   "File Share Access Problems",
			Content: "File share access: 1) Connect using \\\\fileserver\\shared 2) Use domain credentials when prompted 3) Map network drive for easier access 4) Check group membership for folder permissions 5) Clear credential cache if authentication fails 6) Contact IT for permission changes.",
		},
		{
			Title:   "Remote Desktop Configuration",
			Content: "Remote desktop setup: 1) Enable Remote Desktop on target computer 2) Add user to 'Remote Desktop Users' group 3) Configure firewall to allow RDP (port 3389) 4) Use Computer Name or IP address to connect 5) For external access, use VPN first 6) Use Network Level Authentication for security.",
		},
		{
			Title:   "Antivirus Software Management",
			Content: "Antivirus management: 1) Corporate antivirus is automatically deployed 2) Do not install additional antivirus software 3) Scans run automatically daily at 2 AM 4) Quarantine notifications appear in system tray 5) Report false positives to IT immediately 6) Never disable real-time protection.",
		},
		{
			Title:   "Data Backup and Recovery",
			Content: "Backup procedures: 1) OneDrive syncs user documents automatically 2) Critical data should be stored in designated share folders 3) Personal desktop/downloads are not backed up 4) File recovery available for 90 days 5) For urgent recovery, submit priority ticket 6) Test restore procedures quarterly.",
		},
	}

	for _, article := range articles {
		_, err := s.db.Exec(
			"INSERT INTO articles (title, content) VALUES (?, ?)",
			article.Title, article.Content,
		)
		if err != nil {
			return fmt.Errorf("failed to insert article '%s': %w", article.Title, err)
		}
	}

	return nil
}

// GetAllArticles retrieves all articles from the database
func (s *SQLiteDB) GetAllArticles() ([]models.Article, error) {
	rows, err := s.db.Query("SELECT id, title, content FROM articles")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var articles []models.Article
	for rows.Next() {
		var article models.Article
		err := rows.Scan(&article.ID, &article.Title, &article.Content)
		if err != nil {
			return nil, err
		}
		articles = append(articles, article)
	}

	return articles, rows.Err()
}

// GetArticleByID retrieves a specific article by ID
func (s *SQLiteDB) GetArticleByID(id int) (*models.Article, error) {
	var article models.Article
	err := s.db.QueryRow(
		"SELECT id, title, content FROM articles WHERE id = ?", id,
	).Scan(&article.ID, &article.Title, &article.Content)

	if err != nil {
		return nil, err
	}

	return &article, nil
}

// GetArticlesByIDs retrieves multiple articles by their IDs
func (s *SQLiteDB) GetArticlesByIDs(ids []int) ([]models.Article, error) {
	if len(ids) == 0 {
		return []models.Article{}, nil
	}

	// Build placeholders for IN clause
	placeholders := strings.Repeat("?,", len(ids)-1) + "?"
	query := fmt.Sprintf("SELECT id, title, content FROM articles WHERE id IN (%s)", placeholders)

	// Convert int slice to interface slice
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		args[i] = id
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var articles []models.Article
	for rows.Next() {
		var article models.Article
		err := rows.Scan(&article.ID, &article.Title, &article.Content)
		if err != nil {
			return nil, err
		}
		articles = append(articles, article)
	}

	return articles, rows.Err()
}

// CreateQuery creates a new query record
func (s *SQLiteDB) CreateQuery(query string) (*models.Query, error) {
	result, err := s.db.Exec(
		"INSERT INTO queries (query, created_at) VALUES (?, ?)",
		query, time.Now(),
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return s.GetQueryByID(int(id))
}

// GetQueryByID retrieves a query by ID
func (s *SQLiteDB) GetQueryByID(id int) (*models.Query, error) {
	var query models.Query
	err := s.db.QueryRow(
		"SELECT id, query, created_at FROM queries WHERE id = ?", id,
	).Scan(&query.ID, &query.Query, &query.CreatedAt)

	if err != nil {
		return nil, err
	}

	return &query, nil
}

// CreateSearchResult creates a new search result record
func (s *SQLiteDB) CreateSearchResult(queryID int, summary string, relevantArticleIDs []int) (*models.SearchResult, error) {
	// Convert slice to JSON
	articleIDsJSON, err := json.Marshal(relevantArticleIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal article IDs: %w", err)
	}

	result, err := s.db.Exec(
		"INSERT INTO search_results (query_id, ai_summary_answer, ai_relevant_articles, created_at) VALUES (?, ?, ?, ?)",
		queryID, summary, string(articleIDsJSON), time.Now(),
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return s.GetSearchResultByID(int(id))
}

// GetSearchResultByID retrieves a search result by ID
func (s *SQLiteDB) GetSearchResultByID(id int) (*models.SearchResult, error) {
	var result models.SearchResult
	var articleIDsJSON string

	err := s.db.QueryRow(
		"SELECT id, query_id, ai_summary_answer, ai_relevant_articles, created_at FROM search_results WHERE id = ?", id,
	).Scan(&result.ID, &result.QueryID, &result.AISummaryAnswer, &articleIDsJSON, &result.CreatedAt)

	if err != nil {
		return nil, err
	}

	// Parse JSON array
	err = json.Unmarshal([]byte(articleIDsJSON), &result.AIRelevantArticles)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal article IDs: %w", err)
	}

	return &result, nil
}

// GetSearchResultByQueryID retrieves a search result by query ID
func (s *SQLiteDB) GetSearchResultByQueryID(queryID int) (*models.SearchResult, error) {
	var result models.SearchResult
	var articleIDsJSON string

	err := s.db.QueryRow(
		"SELECT id, query_id, ai_summary_answer, ai_relevant_articles, created_at FROM search_results WHERE query_id = ?", queryID,
	).Scan(&result.ID, &result.QueryID, &result.AISummaryAnswer, &articleIDsJSON, &result.CreatedAt)

	if err != nil {
		return nil, err
	}

	// Parse JSON array
	err = json.Unmarshal([]byte(articleIDsJSON), &result.AIRelevantArticles)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal article IDs: %w", err)
	}

	return &result, nil
}

// Close closes the database connection
func (s *SQLiteDB) Close() error {
	return s.db.Close()
}
