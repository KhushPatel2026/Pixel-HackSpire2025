### LearnFlow API Endpoints

All endpoints, except authentication and social authentication endpoints, require a valid JWT token in the `x-access-token` header (format: `<token>`). The token is verified by decoding the email and checking for a matching user in the database, as implemented in the provided controllers.

#### Base URL
```
http://localhost:3000
```

#### Authentication Endpoints (`/api/auth`)

1. **Register a User**
   - **Method**: POST
   - **Path**: `/api/auth/register`
   - **Description**: Creates a new user account with hashed password.
   - **Request Headers**: None
   - **Request Body**:
     ```json
     {
       "name": "string",
       "email": "string",
       "password": "string"
     }
     ```
   - **Response**:
     - Success (200):
       ```json
       {
         "status": "ok",
         "user": "string (JWT token)"
       }
       ```
     - Error (200, duplicate email):
       ```json
       {
         "status": "error",
         "error": "Duplicate email"
       }
       ```
     - Error (500):
       ```json
       {
         "status": "error",
         "error": "Server error"
       }
       ```

2. **Login a User**
   - **Method**: POST
   - **Path**: `/api/auth/login`
   - **Description**: Authenticates a user and returns a JWT token.
   - **Request Headers**: None
   - **Request Body**:
     ```json
     {
       "email": "string",
       "password": "string"
     }
     ```
   - **Response**:
     - Success (200):
       ```json
       {
         "status": "ok",
         "user": "string (JWT token)"
       }
       ```
     - Error (200, invalid login):
       ```json
       {
         "status": "error",
         "error": "Invalid login"
       }
       ```
     - Error (200, invalid password):
       ```json
       {
         "status": "error",
         "user	"user": false
       }
       ```
     - Error (500):
       ```json
       {
         "status": "error",
         "error": "Server error"
       }
       ```

3. **Verify Token**
   - **Method**: GET
   - **Path**: `/api/auth/verify-token`
   - **Description**: Verifies the validity of a JWT token.
   - **Request Headers**:
     - `x-access-token`: `string (JWT token)`
   - **Request Body**: None
   - **Response**:
     - Success (200):
       ```json
       {
         "status": "ok",
         "decoded": {
           "name": "string",
           "email": "string",
           "iat": "number",
           "exp": "number"
         }
       }
       ```
     - Error (200, no token):
       ```json
       {
         "status": "error",
         "error": "No token provided"
       }
       ```
     - Error (200, invalid token):
       ```json
       {
         "status": "error",
         "error": "Invalid or expired token"
       }
       ```

#### Profile Endpoints (`/api`)

4. **Get User Profile**
   - **Method**: GET
   - **Path**: `/api/profile`
   - **Description**: Retrieves the authenticated user's profile.
   - **Request Headers**:
     - `x-access-token`: `string (JWT token)`
   - **Request Body**: None
   - **Response**:
     - Success (200):
       ```json
       {
         "status": "ok",
         "profile": {
           "_id": "string",
           "name": "string",
           "email": "string",
           "learningPreferences": {
             "preferredDifficulty": "string",
             "learningStyle": "string",
             "dailyStudyTime": "number"
           },
           "progressMetrics": {
             "totalCourses": "number",
             "completedCourses": "number",
             "totalStudyTime": "number"
           }
         }
       }
       ```
     - Error (404):
       ```json
       {
         "status": "error",
         "error": "User not found"
       }
       ```
     - Error (200, invalid token):
       ```json
       {
         "status": "error",
         "error": "invalid token"
       }
       ```

5. **Edit User Profile**
   - **Method**: POST
   - **Path**: `/api/profile/edit`
   - **Description**: Updates the authenticated user's profile information.
   - **Request Headers**:
     - `x-access-token`: `string (JWT token)`
   - **Request Body**:
     ```json
     {
       "name": "string",
       "email": "string"
     }
     ```
   - **Response**:
     - Success (200):
       ```json
       {
         "status": "ok",
         "profile": {
           "_id": "string",
           "name": "string",
           "email": "string",
           "learningPreferences": {...},
           "progressMetrics": {...}
         }
       }
       ```
     - Error (200, invalid token):
       ```json
       {
         "status": "error",
         "error": "invalid token"
       }
       ```
     - Error (500):
       ```json
       {
         "status": "error",
         "error": "Server error"
       }
       ```

6. **Change Password**
   - **Method**: POST
   - **Path**: `/api/profile/change-password`
   - **Description**: Changes the authenticated user's password.
   - **Request Headers**:
     - `x-access-token`: `string (JWT token)`
   - **Request Body**:
     ```json
     {
       "currentPassword": "string",
       "newPassword": "string"
     }
     ```
   - **Response**:
     - Success (200):
       ```json
       {
         "status": "ok"
       }
       ```
     - Error (400):
       ```json
       {
         "status": "error",
         "error": "Current password is incorrect"
       }
       ```
     - Error (404):
       ```json
       {
         "status": "error",
         "error": "User not found"
       }
       ```
     - Error (200, invalid token):
       ```json
       {
         "status": "error",
         "error": "invalid token"
       }
       ```
     - Error (500):
       ```json
       {
         "status": "error",
         "error": "Server error"
       }
       ```

#### Social Authentication Endpoints (`/auth`)

7. **Google OAuth Login**
   - **Method**: GET
   - **Path**: `/auth/google`
   - **Description**: Initiates Google OAuth login flow.
   - **Request Headers**: None
   - **Request Body**: None
   - **Response**: Redirects to Google OAuth consent screen.

8. **Google OAuth Callback**
   - **Method**: GET
   - **Path**: `/auth/google/callback`
   - **Description**: Handles Google OAuth callback and redirects to frontend with JWT token.
   - **Request Headers**: None
   - **Request Body**: None
   - **Response**: Redirects to `http://localhost:5173/profile?token=<JWT_TOKEN>`
     - On failure, redirects to `/register`.

9. **GitHub OAuth Login**
   - **Method**: GET
   - **Path**: `/auth/github`
   - **Description**: Initiates GitHub OAuth login flow.
   - **Request Headers**: None
   - **Request Body**: None
   - **Response**: Redirects to GitHub OAuth consent screen.

10. **GitHub OAuth Callback**
    - **Method**: GET
    - **Path**: `/auth/github/callback`
    - **Description**: Handles GitHub OAuth callback and redirects to frontend with JWT token.
    - **Request Headers**: None
    - **Request Body**: None
    - **Response**: Redirects to `http://localhost:5173/profile?token=<JWT_TOKEN>`
      - On failure, redirects to `/register`.

#### Learning Endpoints (`/api/learning`)

11. **Simplify Content**
    - **Method**: POST
    - **Path**: `/api/learning/simplify-content`
    - **Description**: Simplifies provided content (text or YouTube video transcript) using Gemini AI.
    - **Request Headers**:
      - `x-access-token`: `string (JWT token)`
    - **Request Body**:
      ```json
      {
        "content": "string",
        "contentType": "string (text|video)"
      }
      ```
    - **Response**:
      - Success (200):
        ```json
        {
          "status": "ok",
          "data": {
            "simplifiedText": "string",
            "keyPoints": ["string", "string", ...]
          }
        }
        ```
      - Error (400):
        ```json
        {
          "status": "error",
          "error": "Content and contentType are required"
        }
        ```
      - Error (401):
        ```json
        {
          "status": "error",
          "error": "No token provided | Invalid token"
        }
        ```
      - Error (404):
        ```json
        {
          "status": "error",
          "error": "User not found"
        }
        ```
      - Error (500):
        ```json
        {
          "status": "error",
          "error": "Failed to simplify content"
        }
        ```

12. **Generate Learning Path**
    - **Method**: POST
    - **Path**: `/api/learning/generate-learning-path`
    - **Description**: Generates a personalized learning path based on course name and difficulty.
    - **Request Headers**:
      - `x-access-token`: `string (JWT token)`
    - **Request Body**:
      ```json
      {
        "courseName": "string",
        "difficultyLevel": "string (Easy|Medium|Hard)"
      }
      ```
    - **Response**:
      - Success (200):
        ```json
        {
          "status": "ok",
          "data": {
            "_id": "string",
            "userId": "string",
            "courseName": "string",
            "topics": [
              {
                "topicName": "string",
                "topicDescription": "string",
                "topicResourceLink": ["string", ...],
                "timeSpent": "number",
                "completionStatus": "boolean",
                "completionDate": "ISODate",
                "aiGeneratedSummary": "string"
              },
              ...
            ],
            "courseCompletionStatus": "number",
            "currentStep": "number",
            "courseCompletionDate": "ISODate",
            "courseStrength": "string",
            "courseWeakness": "string",
            "courseScore": "number",
            "courseResult": "string",
            "courseDuration": "number",
            "quizzes": [
              {
                "quizId": "string",
                "completed": "boolean"
              },
              ...
            ],
            "difficultyLevel": "string",
            "gamification": {
              "badges": ["string", ...],
              "streak": "number",
              "points": "number"
            }
          }
        }
        ```
      - Error (400):
        ```json
        {
          "status": "error",
          "error": "courseName and difficultyLevel are required"
        }
        ```
      - Error (401):
        ```json
        {
          "status": "error",
          "error": "No token provided | Invalid token"
        }
        ```
      - Error (404):
        ```json
        {
          "status": "error",
          "error": "User not found"
        }
        ```
      - Error (500):
        ```json
        {
          "status": "error",
          "error": "Failed to generate learning path"
        }
        ```

13. **Handle Chat**
    - **Method**: POST
    - **Path**: `/api/learning/chat`
    - **Description**: Processes a question and returns an AI-generated response, saving to chat history.
    - **Request Headers**:
      - `x-access-token`: `string (JWT token)`
    - **Request Body**:
      ```json
      {
        "question": "string",
        "type": "string (text|voice, optional)"
      }
      ```
    - **Response**:
      - Success (200):
        ```json
        {
          "status": "ok",
          "data": {
            "answer": "string",
            "chatHistory": [
              {
                "question": "string",
                "answer": "string",
                "date": "ISODate",
                "source": "string"
              },
              ...
            ]
          }
        }
        ```
      - Error (400):
        ```json
        {
          "status": "error",
          "error": "Question is required"
        }
        ```
      - Error (401):
        ```json
        {
          "status": "error",
          "error": "No token provided | Invalid token"
        }
        ```
      - Error (404):
        ```json
        {
          "status": "error",
          "error": "User not found"
        }
        ```
      - Error (500):
        ```json
        {
          "status": "error",
          "error": "Failed to process chat"
        }
        ```

14. **Generate Quiz**
    - **Method**: POST
    - **Path**: `/api/learning/generate-quiz`
    - **Description**: Generates a quiz for a specific topic and difficulty level.
    - **Request Headers**:
      - `x-access-token`: `string (JWT token)`
    - **Request Body**:
      ```json
      {
        "topicName": "string",
        "difficultyLevel": "string (Easy|Medium|Hard)",
        "numQuestions": "number (optional, default: 5)"
      }
      ```
    - **Response**:
      - Success (200):
        ```json
        {
          "status": "ok",
          "data": {
            "_id": "string",
            "userId": "string",
            "topicName": "string",
            "quizTime": "number",
            "completedTime": "ISODate",
            "quizDate": "ISODate",
            "questions": [
              {
                "question": "string",
                "options": ["string", ...],
                "correctAnswer": "string",
                "questionType": "string (MCQ|True/False|Short Answer)",
                "marks": "number",
                "aiGeneratedExplanation": "string"
              },
              ...
            ],
            "responses": [
              {
                "question": "string",
                "selectedOption": "string",
                "isCorrect": "boolean",
                "marksObtained": "number",
                "questionType": "string",
                "responseTime": "number",
                "feedback": "string"
              },
              ...
            ],
            "quizResult": "string",
            "quizScore": "number",
            "strength": "string",
            "weakness": "string",
            "difficultyLevel": "string"
          }
        }
        ```
      - Error (400):
        ```json
        {
          "status": "error",
          "error": "topicName and difficultyLevel are required"
        }
        ```
      - Error (401):
        ```json
        {
          "status": "error",
          "error": "No token provided | Invalid token"
        }
        ```
      - Error (404):
        ```json
        {
          "status": "error",
          "error": "Learning path not found for this topic | User not found"
        }
        ```
      - Error (500):
        ```json
        {
          "status": "error",
          "error": "Failed to generate quiz"
        }
        ```

15. **Submit Quiz**
    - **Method**: POST
    - **Path**: `/api/learning/submit-quiz`
    - **Description**: Submits quiz responses and updates learning path progress.
    - **Request Headers**:
      - `x-access-token`: `string (JWT token)`
    - **Request Body**:
      ```json
      {
        "quizId": "string",
        "responses": [
          {
            "question": "string",
            "selectedOption": "string",
            "responseTime": "number"
          },
          ...
        ]
      }
      ```
    - **Response**:
      - Success (200):
        ```json
        {
          "status": "ok",
          "data": {
            "quiz": {
              "_id": "string",
              "userId": "string",
              "topicName": "string",
              "responses": [
                {
                  "question": "string",
                  "selectedOption": "string",
                  "isCorrect": "boolean",
                  "marksObtained": "number",
                  "questionType": "string",
                  "responseTime": "number",
                  "feedback": "string"
                },
                ...
              ],
              "quizScore": "number",
              "quizResult": "string",
              "completedTime": "ISODate",
              ...
            },
            "message": "Quiz submitted successfully"
          }
        }
        ```
      - Error (400):
        ```json
        {
          "status": "error",
          "error": "quizId and responses array are required"
        }
        ```
      - Error (401):
        ```json
        {
          "status": "error",
          "error": "No token provided | Invalid token"
        }
        ```
      - Error (404):
        ```json
        {
          "status": "error",
          "error": "Quiz not found | Learning path not found for this quiz | User not found"
        }
        ```
      - Error (500):
        ```json
        {
          "status": "error",
          "error": "Failed to submit quiz"
        }
        ```

16. **Get Progress**
    - **Method**: GET
    - **Path**: `/api/learning/progress`
    - **Description**: Retrieves the user's learning progress and AI-generated progress report.
    - **Request Headers**:
      - `x-access-token`: `string (JWT token)`
    - **Request Body**: None
    - **Response**:
      - Success (200):
        ```json
        {
          "status": "ok",
          "data": {
            "completedCourses": "number",
            "activeCourses": "number",
            "averageScore": "number",
            "totalStudyTime": "number",
            "recentActivity": [
              {
                "question": "string",
                "answer": "string",
                "date": "ISODate",
                "source": "string"
              },
              ...
            ],
            "progressReport": {
              "strengths": ["string", ...],
              "improvements": ["string", ...],
              "recommendations": ["string", ...],
              "summary": "string"
            }
          }
        }
        ```
      - Error (401):
        ```json
        {
          "status": "error",
          "error": "No token provided | Invalid token"
        }
        ```
      - Error (404):
        ```json
        {
          "status": "error",
          "error": "User not found"
        }
        ```
      - Error (500):
        ```json
        {
          "status": "error",
          "error": "Failed to fetch progress"
        }
        ```

17. **Get Dashboard Data**
    - **Method**: GET
    - **Path**: `/api/learning/dashboard`
    - **Description**: Retrieves dashboard data including learning paths, quiz stats, and gamification metrics.
    - **Request Headers**:
      - `x-access-token`: `string (JWT token)`
    - **Request Body**: None
    - **Response**:
      - Success (200):
        ```json
        {
          "status": "ok",
          "data": {
            "learningPaths": [
              {
                "courseName": "string",
                "progress": "number",
                "strength": "string",
                "weakness": "string",
                "points": "number"
              },
              ...
            ],
            "quizStats": {
              "totalQuizzes": "number",
              "averageScore": "number",
              "passRate": "number"
            },
            "recentActivities": [
              {
                "question": "string",
                "answer": "string",
                "date": "ISODate",
                "source": "string"
              },
              ...
            ],
            "gamification": {
              "totalPoints": "number",
              "activeStreaks": ["number", ...]
            }
          }
        }
        ```
      - Error (401):
        ```json
        {
          "status": "error",
          "error": "No token provided | Invalid token"
        }
        ```
      - Error (404):
        ```json
        {
          "status": "error",
          "error": "User not found"
        }
        ```
      - Error (500):
        ```json
        {
          "status": "error",
          "error": "Failed to fetch dashboard data"
        }
        ```