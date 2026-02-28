import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PomodoroApp.css';

const MODES = {
  pomodoro: { label: 'Pomodoro', duration: 25 * 60, color: '#ef4444' },
  short: { label: 'Kısa Mola', duration: 5 * 60, color: '#22c55e' },
  long: { label: 'Uzun Mola', duration: 15 * 60, color: '#3b82f6' }
};

function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  [0, 0.3, 0.6].forEach(delay => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.3);
  });
}

function PomodoroApp() {
  const [mode, setMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(() => {
    return parseInt(localStorage.getItem('completedPomodoros') || '0');
  });
  const [todos, setTodos] = useState(() => {
    return JSON.parse(localStorage.getItem('todos') || '[]');
  });
  const [newTodo, setNewTodo] = useState('');
  const [activeTab, setActiveTab] = useState('timer');
  const intervalRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('completedPomodoros', completedPomodoros.toString());
  }, [completedPomodoros]);

  const handleComplete = useCallback(() => {
    playBeep();
    setIsRunning(false);
    if (mode === 'pomodoro') {
      setCompletedPomodoros(prev => prev + 1);
    }
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, handleComplete]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
    setIsRunning(false);
  };

  const resetTimer = () => {
    setTimeLeft(MODES[mode].duration);
    setIsRunning(false);
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos(prev => [...prev, {
      id: Date.now(),
      text: newTodo.trim(),
      completed: false,
      createdAt: new Date().toLocaleDateString('tr-TR')
    }]);
    setNewTodo('');
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(t => !t.completed));
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const progress = ((MODES[mode].duration - timeLeft) / MODES[mode].duration) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const activeColor = MODES[mode].color;
  const completedTodos = todos.filter(t => t.completed).length;

  return (
    <div className="pomodoro-app">
      {/* Header */}
      <div className="header">
        <h1>🍅 Pomodoro</h1>
        <div className="stats-bar">
          <span>🔥 {completedPomodoros} pomodoro tamamlandı</span>
          <span>✅ {completedTodos}/{todos.length} görev</span>
        </div>
      </div>

      {/* Tab Menü */}
      <div className="tabs">
        <button className={activeTab === 'timer' ? 'tab active' : 'tab'} onClick={() => setActiveTab('timer')}>⏱️ Zamanlayıcı</button>
        <button className={activeTab === 'todos' ? 'tab active' : 'tab'} onClick={() => setActiveTab('todos')}>📋 Görevler {todos.length > 0 && <span className="badge">{todos.filter(t => !t.completed).length}</span>}</button>
        <button className={activeTab === 'stats' ? 'tab active' : 'tab'} onClick={() => setActiveTab('stats')}>📊 İstatistik</button>
      </div>

      {/* Timer Tab */}
      {activeTab === 'timer' && (
        <div className="timer-section">
          <div className="mode-buttons">
            {Object.entries(MODES).map(([key, val]) => (
              <button key={key} className={mode === key ? 'mode-btn active' : 'mode-btn'} style={mode === key ? { borderColor: val.color, color: val.color, background: val.color + '22' } : {}} onClick={() => switchMode(key)}>
                {val.label}
              </button>
            ))}
          </div>

          <div className="timer-circle-wrapper">
            <svg className="timer-svg" viewBox="0 0 280 280">
              <circle cx="140" cy="140" r="120" fill="none" stroke="#1e1e3a" strokeWidth="8" />
              <circle
                cx="140" cy="140" r="120" fill="none"
                stroke={activeColor} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <div className="timer-display">
              <div className="timer-time" style={{ color: activeColor }}>{minutes}:{seconds}</div>
              <div className="timer-mode">{MODES[mode].label}</div>
            </div>
          </div>

          <div className="timer-controls">
            <button className="control-btn reset" onClick={resetTimer}>↺</button>
            <button className="control-btn play" style={{ background: activeColor }} onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? '⏸' : '▶'}
            </button>
            <button className="control-btn skip" onClick={() => handleComplete()}>⏭</button>
          </div>
        </div>
      )}

      {/* Todos Tab */}
      {activeTab === 'todos' && (
        <div className="todos-section">
          <div className="todo-input">
            <input
              type="text"
              placeholder="Yeni görev ekle..."
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addTodo()}
            />
            <button onClick={addTodo}>+</button>
          </div>

          {todos.length === 0 ? (
            <div className="empty-state">Henüz görev yok 🎉</div>
          ) : (
            <>
              {todos.map(todo => (
                <div key={todo.id} className={todo.completed ? 'todo-item completed' : 'todo-item'}>
                  <button className="todo-check" onClick={() => toggleTodo(todo.id)} style={todo.completed ? { background: '#22c55e', borderColor: '#22c55e' } : {}}>
                    {todo.completed && '✓'}
                  </button>
                  <span className="todo-text">{todo.text}</span>
                  <span className="todo-date">{todo.createdAt}</span>
                  <button className="todo-delete" onClick={() => deleteTodo(todo.id)}>🗑️</button>
                </div>
              ))}
              {completedTodos > 0 && (
                <button className="clear-btn" onClick={clearCompleted}>
                  🗑️ Tamamlananları Temizle ({completedTodos})
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">🍅</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{completedPomodoros}</div>
            <div className="stat-label">Tamamlanan Pomodoro</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-value" style={{ color: '#3b82f6' }}>{Math.round(completedPomodoros * 25)} dk</div>
            <div className="stat-label">Toplam Çalışma Süresi</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value" style={{ color: '#22c55e' }}>{completedTodos}</div>
            <div className="stat-label">Tamamlanan Görev</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{todos.filter(t => !t.completed).length}</div>
            <div className="stat-label">Bekleyen Görev</div>
          </div>
          <button className="reset-stats" onClick={() => { setCompletedPomodoros(0); localStorage.removeItem('completedPomodoros'); }}>
            🔄 İstatistikleri Sıfırla
          </button>
        </div>
      )}
    </div>
  );
}

export default PomodoroApp;