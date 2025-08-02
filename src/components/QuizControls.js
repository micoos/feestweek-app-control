import React, { useState, useEffect, useCallback } from 'react';
import { Play, SkipBack, SkipForward, RotateCcw, ChevronLeft, ChevronRight, HelpCircle, X, Eye } from 'lucide-react';
import './QuizControls.css';

const QuizControls = ({ socketClient, onClose }) => {
  const [quizState, setQuizState] = useState({ currentRound: 0, totalRounds: 0 });
  const [questionState, setQuestionState] = useState({ currentQuestion: -1, totalQuestions: 0, roundType: '' });
  const [isQuizActive, setIsQuizActive] = useState(false);

  // Define all functions before useEffect
  const sendQuizCommand = useCallback((command, data = {}) => {
    if (socketClient) {
      socketClient.emit('quiz_control', { command, ...data });
    }
  }, [socketClient]);

  const sendQuizNavigate = useCallback((direction, target) => {
    if (socketClient) {
      socketClient.emit('quiz_navigate', { direction, target });
    }
  }, [socketClient]);

  const startQuiz = useCallback(() => {
    sendQuizCommand('start');
  }, [sendQuizCommand]);

  const resetQuiz = useCallback(() => {
    if (window.confirm('Weet je zeker dat je de quiz wilt resetten?')) {
      sendQuizCommand('reset');
    }
  }, [sendQuizCommand]);
  
  const stopQuiz = useCallback(() => {
    if (window.confirm('Weet je zeker dat je de quiz wilt stoppen?')) {
      sendQuizCommand('stop');
      // Go back to gallery mode
      if (socketClient) {
        socketClient.emit('control_action', 'gallery');
      }
      onClose();
    }
  }, [sendQuizCommand, socketClient, onClose]);

  const nextRound = useCallback(() => {
    sendQuizCommand('next');
  }, [sendQuizCommand]);

  const prevRound = useCallback(() => {
    sendQuizCommand('prev');
  }, [sendQuizCommand]);

  const nextQuestion = useCallback(() => {
    sendQuizNavigate('next', 'question');
  }, [sendQuizNavigate]);

  const prevQuestion = useCallback(() => {
    sendQuizNavigate('prev', 'question');
  }, [sendQuizNavigate]);

  useEffect(() => {
    if (!socketClient) return;

    const handleQuizState = (eventName, stateData) => {
      console.log('[QuizControls] Received quiz state:', stateData);
      
      if (!stateData || typeof stateData.currentRound === 'undefined') {
        console.error('[QuizControls] Invalid quiz state data:', stateData);
        return;
      }
      
      setQuizState(stateData);
      setIsQuizActive(stateData.currentRound > 0);
    };

    const handleQuestionState = (eventName, stateData) => {
      console.log('[QuizControls] Received question state:', stateData);
      
      if (!stateData) {
        console.error('[QuizControls] Invalid question state data:', stateData);
        return;
      }
      
      setQuestionState(stateData);
    };

    socketClient.on('quiz:state', handleQuizState);
    socketClient.on('quiz:questionState', handleQuestionState);
    
    // Request current state when component mounts with a small delay
    // to ensure handlers are properly registered
    const timeoutId = setTimeout(() => {
      console.log('[QuizControls] Requesting quiz state...');
      socketClient.emit('quiz:requestState');
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      socketClient.off('quiz:state', handleQuizState);
      socketClient.off('quiz:questionState', handleQuestionState);
    };
  }, [socketClient]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore if user is typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
      
      switch(event.key) {
        case 'ArrowRight':
          event.preventDefault();
          if (questionState && questionState.totalQuestions > 0 && questionState.currentQuestion < questionState.totalQuestions - 1) {
            nextQuestion();
          } else if (quizState && quizState.currentRound < quizState.totalRounds) {
            nextRound();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (questionState && questionState.currentQuestion > -1) {
            prevQuestion();
          } else if (quizState && quizState.currentRound > 0) {
            prevRound();
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (!isQuizActive) {
            startQuiz();
          }
          break;
        case 'r':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            resetQuiz();
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'x':
        case 'X':
          if (isQuizActive) {
            event.preventDefault();
            stopQuiz();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuizActive, quizState, questionState, nextQuestion, prevQuestion, nextRound, prevRound, startQuiz, resetQuiz, stopQuiz, onClose]);

  const getRoundInfo = () => {
    if (!quizState || quizState.currentRound === undefined) return 'Onbekend';
    if (quizState.currentRound === 0) return 'Start scherm';
    if (quizState.currentRound === 1) return 'Uitleg';
    return `Ronde ${quizState.currentRound - 1}`;
  };

  const getQuestionInfo = () => {
    if (!questionState) return 'Onbekend';
    if (questionState.currentQuestion === -1) {
      return questionState.roundType === 'clips' ? 'Antwoorden inleveren' : 'Ronde intro';
    }
    return `Vraag ${questionState.currentQuestion + 1} van ${questionState.totalQuestions}`;
  };

  return (
    <div className="quiz-controls-modal">
      <div className="quiz-controls">
        <div className="quiz-header">
          <h2>Quiz Control</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="quiz-status">
          <div className="status-item">
            <strong>Status:</strong> {isQuizActive ? 'Actief' : 'Niet gestart'}
          </div>
          <div className="status-item">
            <strong>Huidige positie:</strong> {getRoundInfo()}
          </div>
          {isQuizActive && quizState && quizState.currentRound > 1 && (
            <div className="status-item">
              <strong>Vraag:</strong> {getQuestionInfo()}
            </div>
          )}
        </div>

        <div className="quiz-main-controls">
          {!isQuizActive ? (
            <button onClick={startQuiz} className="quiz-btn primary large">
              <Play size={24} />
              Start Quiz
            </button>
          ) : (
            <>
              <div className="round-controls">
                <h3>Ronde Navigatie</h3>
                <div className="button-group">
                  <button 
                    onClick={prevRound} 
                    className="quiz-btn"
                    disabled={!quizState || quizState.currentRound <= 0}
                  >
                    <SkipBack size={20} />
                    Vorige Ronde
                  </button>
                  <span className="round-indicator">
                    {quizState ? `${quizState.currentRound} / ${quizState.totalRounds}` : '- / -'}
                  </span>
                  <button 
                    onClick={nextRound} 
                    className="quiz-btn"
                    disabled={!quizState || quizState.currentRound >= quizState.totalRounds}
                  >
                    Volgende Ronde
                    <SkipForward size={20} />
                  </button>
                </div>
              </div>

              {quizState && quizState.currentRound > 1 && questionState && questionState.totalQuestions > 0 && (
                <div className="question-controls">
                  <h3>Vraag Navigatie</h3>
                  <div className="button-group">
                    <button 
                      onClick={prevQuestion} 
                      className="quiz-btn"
                      disabled={questionState.currentQuestion <= -1}
                    >
                      <ChevronLeft size={20} />
                      Vorige Vraag
                    </button>
                    <span className="question-indicator">
                      {questionState.currentQuestion + 1} / {questionState.totalQuestions}
                    </span>
                    <button 
                      onClick={nextQuestion} 
                      className="quiz-btn"
                      disabled={questionState.currentQuestion >= questionState.totalQuestions - 1}
                    >
                      Volgende Vraag
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* Music round controls */}
              {quizState && quizState.currentRound > 1 && questionState && questionState.roundType === 'music' && questionState.currentQuestion >= 0 && (
                <div className="music-controls">
                  <h3>Muziek Controls</h3>
                  <div className="button-group">
                    <button 
                      onClick={() => socketClient.emit('quiz:music_control', { command: 'show_answer' })} 
                      className="quiz-btn"
                    >
                      <Eye size={20} />
                      Toon Antwoord
                    </button>
                  </div>
                </div>
              )}

              <div className="danger-controls">
                <button onClick={resetQuiz} className="quiz-btn danger">
                  <RotateCcw size={20} />
                  Reset Quiz
                </button>
                <button onClick={stopQuiz} className="quiz-btn danger">
                  <X size={20} />
                  Stop Quiz
                </button>
              </div>
            </>
          )}
        </div>

        <div className="quiz-help">
          <HelpCircle size={16} />
          <span>Gebruik de pijltjestoetsen voor snelle navigatie door de quiz</span>
        </div>

        <div className="keyboard-shortcuts">
          <h4>Keyboard Shortcuts:</h4>
          <ul>
            <li><kbd>→</kbd> Volgende vraag/ronde</li>
            <li><kbd>←</kbd> Vorige vraag/ronde</li>
            <li><kbd>Enter</kbd> Start quiz (wanneer niet actief)</li>
            <li><kbd>X</kbd> Stop quiz</li>
            <li><kbd>Ctrl+R</kbd> Reset quiz</li>
            <li><kbd>Esc</kbd> Sluit dit venster</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuizControls;