CREATE DATABASE IF NOT EXISTS tsapp_db;
USE tsapp_db;

CREATE TABLE IF NOT EXISTS agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50),
  status ENUM('active', 'inactive') DEFAULT 'active'
);

INSERT INTO agents (name, email, phone, role, status) VALUES 
('Budi Santoso', 'budi@example.com', '08123456789', 'Technical Support', 'active'),
('Siti Aminah', 'siti@example.com', '08129876543', 'Migration Specialist', 'active'),
('Rudi Hermawan', 'rudi@example.com', '08134567890', 'Trainer', 'inactive');
