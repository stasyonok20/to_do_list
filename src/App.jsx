import React, { useState, useEffect } from 'react';
import './App.css';
import ToDoForm from "./AddTask";
import ToDo from "./Task";
import axios from 'axios';

const TASKS_STORAGE_KEY = 'tasks-list-project-web';

function App() {
  const [rates, setRates] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  
  // Разделяем загрузку и ошибки
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingCurrency, setLoadingCurrency] = useState(true);
  const [weatherError, setWeatherError] = useState('');
  const [currencyError, setCurrencyError] = useState('');
  
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    // --- 1. ФУНКЦИЯ ДЛЯ ВАЛЮТЫ ---
    async function fetchCurrency() {
      try {
        // Надежный резервный API ЦБ РФ (через надежное зеркало)
        const res = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
        const usd = res.data.Valute.USD.Value.toFixed(2);
        const eur = res.data.Valute.EUR.Value.toFixed(2);
        setRates({ USDrate: usd, EURrate: eur });
      } catch (err) {
        console.error("Ошибка валюты:", err);
        setCurrencyError('Не удалось загрузить курс валют.');
      } finally {
        setLoadingCurrency(false);
      }
    }

    // --- 2. ФУНКЦИЯ ДЛЯ ПОГОДЫ ---
    async function fetchWeather(lat, lon) {
      try {
        // Простой и безотказный API погоды без ключей
        const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        setWeatherData(res.data.current_weather);
      } catch (err) {
        console.error("Ошибка погоды:", err);
        setWeatherError('Не удалось загрузить погоду.');
      } finally {
        setLoadingWeather(false);
      }
    }

    // Запускаем валюту сразу
    fetchCurrency();

    // Запускаем погоду
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          // Если юзер запретил геолокацию — показываем Москву
          fetchWeather(55.75, 37.61);
        },
        { timeout: 5000 } // Если геолокация тупит больше 5 сек - сдаемся и грузим ошибку
      );
    } else {
      fetchWeather(55.75, 37.61);
    }
  }, []);

  // --- Работа с задачами ---
  useEffect(() => {
    const saved = localStorage.getItem(TASKS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setTodos(parsed);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTask = (userInput) => {
    if (userInput.trim() !== "") {
      const newItem = { id: Math.random().toString(36).substr(2, 9), task: userInput, complete: false };
      setTodos([...todos, newItem]);
    }
  };

  const removeTask = (id) => setTodos([...todos.filter((t) => t.id !== id)]);
  const handleToggle = (id) => setTodos([...todos.map((t) => t.id === id ? { ...t, complete: !t.complete } : { ...t })]);

  return (
    <div className="App">
      
      <div className='info' style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', padding: '20px' }}>
        
        {/* БЛОК ВАЛЮТЫ */}
        <div className='money' style={{ background: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '10px', color: 'white' }}>
          {loadingCurrency ? <p>Загрузка валют...</p> : 
           currencyError ? <p style={{color: 'red'}}>{currencyError}</p> : 
           (
             <>
               <div id="USD">Доллар США $ — {rates.USDrate} руб.</div>
               <div id="EUR">Евро € — {rates.EURrate} руб.</div>
             </>
           )}
        </div>

        {/* БЛОК ПОГОДЫ */}
        <div className="weather-info" style={{ background: 'rgba(0,0,0,0.6)', padding: '15px', borderRadius: '10px', color: 'white' }}>
          {loadingWeather ? <p>Загрузка погоды...</p> : 
           weatherError ? <p style={{color: 'red'}}>{weatherError}</p> : 
           weatherData && (
             <>
               <h3 style={{margin: '0 0 10px 0'}}>Погода за окном:</h3>
               <p style={{margin: '5px 0'}}>Температура: {weatherData.temperature}°C</p>
               <p style={{margin: '5px 0'}}>Ветер: {weatherData.windspeed} км/ч</p>
             </>
           )}
        </div>

      </div>

      <header>
        <h1 className='list-header' style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          Список задач: {todos.length}
        </h1>
      </header>
      
      <ToDoForm addTask={addTask} />
      
      <div style={{ marginTop: '20px', paddingBottom: '50px' }}>
        {todos.map((todo) => (
          <ToDo key={todo.id} todo={todo} toggleTask={handleToggle} removeTask={removeTask} />
        ))}
      </div>
    </div>
  );
}

export default App;