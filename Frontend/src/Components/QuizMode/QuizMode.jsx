import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizMode.css';

const QuizMode = () => {
    const { resourceId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [answers, setAnswers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [resourceTitle, setResourceTitle] = useState('');

    useEffect(() => {
        fetchQuiz();
        fetchResourceTitle();
    }, [resourceId]);

    // Timer
    useEffect(() => {
        if (finished || !quiz || answered) return;
        if (timeLeft <= 0) { handleNext(); return; }
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, finished, quiz, answered]);

    const fetchResourceTitle = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/api/v1/resources/public/get-single-resource/${resourceId}`);
            setResourceTitle(res.data.title);
        } catch (err) { /* ignore */ }
    };

    const fetchQuiz = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:3000/api/v1/quiz/${resourceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuiz(res.data.quiz);
        } catch (err) {
            if (err.response?.status === 404) {
                setQuiz(null);
            } else {
                setError(err.response?.data?.msg || 'Failed to load quiz');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:3000/api/v1/quiz/generate/${resourceId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuiz(res.data.quiz);
            setCurrentQ(0);
            setScore(0);
            setAnswers([]);
            setFinished(false);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to generate quiz');
        } finally {
            setGenerating(false);
        }
    };

    const handleRegenerate = async () => {
        setGenerating(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:3000/api/v1/quiz/generate/${resourceId}?regenerate=true`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuiz(res.data.quiz);
            setCurrentQ(0);
            setScore(0);
            setAnswers([]);
            setFinished(false);
            setSelected(null);
            setAnswered(false);
            setTimeLeft(30);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to regenerate quiz');
        } finally {
            setGenerating(false);
        }
    };

    const handleSelect = (idx) => {
        if (answered) return;
        setSelected(idx);
        setAnswered(true);
        const correct = quiz.questions[currentQ].correctAnswer === idx;
        if (correct) setScore(s => s + 1);
        setAnswers(a => [...a, { selected: idx, correct }]);
    };

    const handleNext = () => {
        if (!answered) {
            setAnswered(true);
            setAnswers(a => [...a, { selected: null, correct: false }]);
        }
        if (currentQ + 1 >= quiz.questions.length) {
            setFinished(true);
        } else {
            setCurrentQ(q => q + 1);
            setSelected(null);
            setAnswered(false);
            setTimeLeft(30);
        }
    };

    const handleRestart = () => {
        setCurrentQ(0);
        setScore(0);
        setAnswers([]);
        setFinished(false);
        setSelected(null);
        setAnswered(false);
        setTimeLeft(30);
    };

    if (loading) return <div className="quiz-container"><div className="quiz-loading">Loading quiz...</div></div>;

    return (
        <div className="quiz-container">
            <div className="quiz-header">
                <h2>🧠 Quiz Mode</h2>
                {resourceTitle && <p className="quiz-resource-title">{resourceTitle}</p>}
            </div>

            {error && <div className="quiz-error">{error}</div>}

            {!quiz && !generating && (
                <div className="quiz-generate-section">
                    <div className="quiz-generate-icon">📝</div>
                    <h3>No quiz available yet</h3>
                    <p>Generate an AI-powered quiz from this resource to test your knowledge!</p>
                    <button className="quiz-generate-btn" onClick={handleGenerate}>
                        🤖 Generate Quiz with AI
                    </button>
                </div>
            )}

            {generating && (
                <div className="quiz-generating">
                    <div className="quiz-spinner"></div>
                    <p>AI is generating your quiz... This may take a moment.</p>
                </div>
            )}

            {quiz && !finished && !generating && (
                <div className="quiz-play">
                    <div className="quiz-progress">
                        <div className="quiz-progress-bar">
                            <div className="quiz-progress-fill" style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}></div>
                        </div>
                        <span className="quiz-progress-text">Question {currentQ + 1} of {quiz.questions.length}</span>
                    </div>

                    <div className="quiz-timer-bar">
                        <div className={`quiz-timer ${timeLeft <= 10 ? 'warning' : ''}`}>
                            ⏱️ {timeLeft}s
                        </div>
                        <div className="quiz-score-display">Score: {score}/{currentQ + (answered ? 1 : 0)}</div>
                    </div>

                    <div className="quiz-question-card">
                        <h3 className="quiz-question-text">{quiz.questions[currentQ].question}</h3>
                        <div className="quiz-options">
                            {quiz.questions[currentQ].options.map((opt, idx) => {
                                let optClass = 'quiz-option';
                                if (answered) {
                                    if (idx === quiz.questions[currentQ].correctAnswer) optClass += ' correct';
                                    else if (idx === selected) optClass += ' wrong';
                                } else if (idx === selected) {
                                    optClass += ' selected';
                                }
                                return (
                                    <button key={idx} className={optClass} onClick={() => handleSelect(idx)} disabled={answered}>
                                        <span className="quiz-option-letter">{String.fromCharCode(65 + idx)}</span>
                                        <span className="quiz-option-text">{opt}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {answered && quiz.questions[currentQ].explanation && (
                            <div className="quiz-explanation">
                                <strong>💡 Explanation:</strong> {quiz.questions[currentQ].explanation}
                            </div>
                        )}
                    </div>

                    <div className="quiz-actions">
                        <button className="quiz-next-btn" onClick={handleNext}>
                            {currentQ + 1 >= quiz.questions.length ? 'Finish Quiz' : 'Next Question →'}
                        </button>
                    </div>
                </div>
            )}

            {finished && (
                <div className="quiz-results">
                    <div className="quiz-results-icon">{score >= quiz.questions.length * 0.7 ? '🏆' : score >= quiz.questions.length * 0.4 ? '👍' : '📖'}</div>
                    <h3>Quiz Complete!</h3>
                    <div className="quiz-score-final">
                        <span className="quiz-score-number">{score}</span>
                        <span className="quiz-score-total">/ {quiz.questions.length}</span>
                    </div>
                    <div className="quiz-score-percent">{Math.round((score / quiz.questions.length) * 100)}%</div>
                    <p className="quiz-score-msg">
                        {score >= quiz.questions.length * 0.7 ? 'Excellent! You have a strong understanding of this material!' :
                            score >= quiz.questions.length * 0.4 ? 'Good effort! Review the explanations to improve.' :
                                'Keep studying! Review the material and try again.'}
                    </p>

                    <div className="quiz-review">
                        <h4>Review Answers</h4>
                        {quiz.questions.map((q, idx) => (
                            <div key={idx} className={`quiz-review-item ${answers[idx]?.correct ? 'correct' : 'wrong'}`}>
                                <div className="quiz-review-q"><strong>Q{idx + 1}:</strong> {q.question}</div>
                                <div className="quiz-review-a">
                                    <span>Your answer: {answers[idx]?.selected !== null ? q.options[answers[idx].selected] : 'Not answered'}</span>
                                    {!answers[idx]?.correct && <span className="quiz-review-correct">Correct: {q.options[q.correctAnswer]}</span>}
                                </div>
                                {q.explanation && <div className="quiz-review-exp">💡 {q.explanation}</div>}
                            </div>
                        ))}
                    </div>

                    <div className="quiz-results-actions">
                        <button className="quiz-restart-btn" onClick={handleRestart}>🔄 Retry Quiz</button>
                        <button className="quiz-regen-btn" onClick={handleRegenerate}>🤖 Generate New Quiz</button>
                        <button className="quiz-back-btn" onClick={() => navigate(`/resource/${resourceId}`)}>← Back to Resource</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizMode;
