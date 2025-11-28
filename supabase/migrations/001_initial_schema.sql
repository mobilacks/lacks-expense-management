-- Lacks Expense Management System
-- Initial Database Schema
-- Created: November 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('user', 'accounting', 'admin');
CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE receipt_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE upload_source AS ENUM ('camera', 'gallery', 'file');
CREATE TYPE audit_action AS ENUM ('created', 'updated', 'submitted', 'approved', 'rejected', 'edited');
CREATE TYPE entity_type AS ENUM ('receipt', 'expense_report', 'expense');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    department_id UUID REFERENCES departments(id),
    entra_id VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense Reports
CREATE TABLE expense_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    status report_status DEFAULT 'draft',
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    rejection_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receipts
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_report_id UUID REFERENCES expense_reports(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    status receipt_status DEFAULT 'draft',
    upload_source upload_source DEFAULT 'file',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses (extracted/edited data for each receipt)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID UNIQUE NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    expense_date DATE,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    department_code_id UUID REFERENCES departments(id),
    extracted_data JSONB,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action audit_action NOT NULL,
    user_id UUID REFERENCES users(id),
    changes JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_entra_id ON users(entra_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);

-- Expense Reports
CREATE INDEX idx_expense_reports_user ON expense_reports(user_id);
CREATE INDEX idx_expense_reports_status ON expense_reports(status);
CREATE INDEX idx_expense_reports_submitted_at ON expense_reports(submitted_at);
CREATE INDEX idx_expense_reports_reviewed_by ON expense_reports(reviewed_by);

-- Receipts
CREATE INDEX idx_receipts_user ON receipts(user_id);
CREATE INDEX idx_receipts_report ON receipts(expense_report_id);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_uploaded_at ON receipts(uploaded_at);

-- Expenses
CREATE INDEX idx_expenses_receipt ON expenses(receipt_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_department ON expenses(department_code_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- Audit Log
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_reports_updated_at BEFORE UPDATE ON expense_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update expense report total amount
CREATE OR REPLACE FUNCTION update_expense_report_total()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expense_report_id IS NOT NULL THEN
        UPDATE expense_reports
        SET total_amount = (
            SELECT COALESCE(SUM(e.amount), 0)
            FROM receipts r
            JOIN expenses e ON e.receipt_id = r.id
            WHERE r.expense_report_id = NEW.expense_report_id
        )
        WHERE id = NEW.expense_report_id;
    END IF;
    
    IF OLD.expense_report_id IS NOT NULL AND OLD.expense_report_id != NEW.expense_report_id THEN
        UPDATE expense_reports
        SET total_amount = (
            SELECT COALESCE(SUM(e.amount), 0)
            FROM receipts r
            JOIN expenses e ON e.receipt_id = r.id
            WHERE r.expense_report_id = OLD.expense_report_id
        )
        WHERE id = OLD.expense_report_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update expense report total when receipts are added/removed/modified
CREATE TRIGGER update_report_total_on_receipt_change
AFTER INSERT OR UPDATE OR DELETE ON receipts
FOR EACH ROW EXECUTE FUNCTION update_expense_report_total();

-- Function to update expense report total when expense amount changes
CREATE OR REPLACE FUNCTION update_expense_report_total_on_expense_change()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE expense_reports
    SET total_amount = (
        SELECT COALESCE(SUM(e.amount), 0)
        FROM receipts r
        JOIN expenses e ON e.receipt_id = r.id
        WHERE r.expense_report_id = (
            SELECT expense_report_id 
            FROM receipts 
            WHERE id = NEW.receipt_id
        )
    )
    WHERE id = (
        SELECT expense_report_id 
        FROM receipts 
        WHERE id = NEW.receipt_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update expense report total when expense amount changes
CREATE TRIGGER update_report_total_on_expense_change
AFTER INSERT OR UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_expense_report_total_on_expense_change();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default departments
INSERT INTO departments (code, name) VALUES
    ('IT', 'Information Technology'),
    ('HR', 'Human Resources'),
    ('FIN', 'Finance'),
    ('MKT', 'Marketing'),
    ('OPS', 'Operations'),
    ('ADMIN', 'Administration');

-- Insert default categories
INSERT INTO categories (name, description) VALUES
    ('Travel', 'Airfare, train tickets, etc.'),
    ('Lodging', 'Hotels, accommodations'),
    ('Meals', 'Business meals and entertainment'),
    ('Transportation', 'Taxis, rideshare, parking, gas'),
    ('Office Supplies', 'Stationery, equipment'),
    ('IT Equipment', 'Computer hardware, accessories'),
    ('Training', 'Courses, conferences, seminars'),
    ('Utilities', 'Phone, internet, utilities'),
    ('Miscellaneous', 'Other business expenses');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE expense_reports IS 'Main expense report container that groups multiple receipts';
COMMENT ON TABLE receipts IS 'Individual receipt images uploaded by users';
COMMENT ON TABLE expenses IS 'Extracted/edited expense data for each receipt (one-to-one with receipts)';
COMMENT ON COLUMN expenses.extracted_data IS 'Raw JSON response from OpenAI Vision API';
COMMENT ON COLUMN expenses.is_edited IS 'Flag to track if user modified AI-extracted data';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all important actions';
