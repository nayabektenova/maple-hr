-- Create the survey table
CREATE TABLE survey (
    survey_id SERIAL PRIMARY KEY,
    survey_name VARCHAR(255) ,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    audience VARCHAR(255)
);

-- Create the questions table
CREATE TABLE questions (
    question_id SERIAL PRIMARY KEY,
    survey_id INT ,
    question_type VARCHAR(100),
    question_title TEXT ,
    FOREIGN KEY (survey_id) REFERENCES survey(survey_id) ON DELETE CASCADE
);
