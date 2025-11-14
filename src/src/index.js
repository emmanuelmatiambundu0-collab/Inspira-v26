import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// Chargement des icônes Lucide pour une belle interface utilisateur mobile
import { Timer, Play, Pause, Repeat2, Settings, List, Plus, Trash2, CheckCircle, RotateCcw } from 'lucide-react';

const App = () => {
  const defaultTasks = [
    { id: 1, name: 'Préparation du Matin (Routine)', duration: 5 * 60, isCompleted: false },
    { id: 2, name: 'Tâche de Travail Profond 1', duration: 25 * 60, isCompleted: false },
    { id: 3, name: 'Pause Courte', duration: 5 * 60, isCompleted: false },
  ];

  // État local de l'application
  const [tasks, setTasks] = useState(defaultTasks);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [newTimerName, setNewTimerName] = useState('');
  const [newTimerDuration, setNewTimerDuration] = useState(25); // en minutes

  const currentTask = tasks[currentTaskIndex];

  // Met à jour le temps restant lorsque la tâche actuelle change
  useEffect(() => {
    if (currentTask) {
      setTimeRemaining(currentTask.duration);
    }
  }, [currentTaskIndex, tasks]);

  // Logique du minuteur (s'exécute à chaque changement de `timeRemaining` ou `isRunning`)
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const timerId = setTimeout(() => {
      setTimeRemaining(prevTime => prevTime - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeRemaining, isRunning]);

  // Logique de fin de minuteur et de transition
  useEffect(() => {
    if (timeRemaining <= 0 && isRunning) {
      // Marque la tâche actuelle comme terminée si ce n'est pas déjà fait
      setTasks(prevTasks =>
        prevTasks.map((task, index) =>
          index === currentTaskIndex ? { ...task, isCompleted: true } : task
        )
      );

      setIsRunning(false);
      // Joue un son de notification (simple alerte visuelle/texte pour ce contexte)
      console.log(`Minuteur pour "${currentTask.name}" terminé !`);

      // Passe à la tâche suivante (ou boucle)
      const nextIndex = (currentTaskIndex + 1) % tasks.length;
      setCurrentTaskIndex(nextIndex);

      // Le prochain `useEffect` (celui en haut) mettra à jour `timeRemaining`
      // Le lancement du prochain minuteur est manuel pour éviter une boucle infinie de tâches terminées.
    }
  }, [timeRemaining, isRunning, currentTaskIndex, tasks, setTasks, currentTask]);


  // --- Fonctions de contrôle du minuteur ---

  const handleToggleTimer = () => {
    if (!currentTask) return;
    setIsRunning(prev => !prev);
  };

  const handleSkipTask = () => {
    setIsRunning(false);
    // Passe à la tâche suivante (avec boucle)
    const nextIndex = (currentTaskIndex + 1) % tasks.length;
    setCurrentTaskIndex(nextIndex);
  };

  const handleResetTask = useCallback(() => {
    setIsRunning(false);
    if (currentTask) {
      setTimeRemaining(currentTask.duration);
    }
  }, [currentTask]);

  const handleResetCycle = () => {
    setIsRunning(false);
    setCurrentTaskIndex(0);
    setTasks(prevTasks =>
      prevTasks.map(task => ({ ...task, isCompleted: false }))
    );
  };

  // --- Fonctions de gestion de la liste ---

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTimerName.trim() === '' || newTimerDuration <= 0) return;

    const newTask = {
      id: Date.now(),
      name: newTimerName.trim(),
      duration: newTimerDuration * 60, // Convertir en secondes
      isCompleted: false,
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
    setNewTimerName('');
    setNewTimerDuration(25);
    setIsSetupOpen(false); // Ferme après l'ajout
  };

  const handleDeleteTask = (id) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    // Assure que l'index actuel reste valide après la suppression
    if (currentTaskIndex >= tasks.length - 1) {
        setCurrentTaskIndex(0);
    }
  };


  // --- Fonctions d'affichage ---

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Calcul du pourcentage de progression
  const progressPercentage = currentTask
    ? ((currentTask.duration - timeRemaining) / currentTask.duration) * 100
    : 0;

  // Style de la barre de progression (utilise Tailwind CSS pour les classes)
  const progressColor = isRunning ? 'bg-indigo-500' : 'bg-gray-400';
  const progressStyle = {
    width: `${progressPercentage}%`,
    transition: 'width 1s linear',
  };

  // --- Composant Tâche individuelle ---
  const TaskItem = ({ task, index }) => (
    <div
      className={`flex items-center justify-between p-3 mb-2 rounded-xl shadow-md cursor-pointer transition ${
        index === currentTaskIndex
          ? 'bg-indigo-100 border-indigo-500 border-2'
          : task.isCompleted
          ? 'bg-green-50'
          : 'bg-white hover:bg-gray-50'
      }`}
      onClick={() => {
        setIsRunning(false); // Pause si on change de tâche
        setCurrentTaskIndex(index);
      }}
    >
      <div className="flex items-center min-w-0">
        <span
          className={`mr-3 w-4 h-4 rounded-full border-2 ${
            task.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
          } flex-shrink-0`}
        >
          {task.isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
        </span>
        <span
          className={`text-lg font-medium truncate ${
            task.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'
          }`}
        >
          {task.name}
        </span>
      </div>
      <div className="flex items-center flex-shrink-0 ml-4 space-x-2">
        <span className="text-sm font-mono text-gray-600">
          {formatTime(task.duration)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Empêche le changement de tâche
            handleDeleteTask(task.id);
          }}
          className="p-1 text-red-500 hover:text-red-700 rounded-full transition"
          aria-label={`Supprimer la tâche ${task.name}`}
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );

  // --- Rendu de l'application principale ---

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        body { font-family: 'Inter', sans-serif; }
        .timer-display {
          font-family: monospace;
          font-weight: 700;
          letter-spacing: -2px;
        }
        /* Mobile focus: assurer un grand bouton tactile */
        .control-button {
          min-width: 6rem;
          min-height: 6rem;
        }
      `}</style>

      <h1 className="text-3xl font-extrabold text-indigo-700 mb-6 flex items-center">
        <Timer className="mr-3 w-8 h-8" />
        Inspira V26
      </h1>

      {/* --- Section Minuteur Principal --- */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 mb-8 border-t-8 border-indigo-500">
        <div className="text-center mb-4">
          <p className="text-xl font-semibold text-gray-500 truncate">
            {currentTask ? currentTask.name : 'Aucune tâche sélectionnée'}
          </p>
        </div>

        {/* Affichage du temps */}
        <div className="text-center my-6">
          <p className="timer-display text-8xl text-indigo-800 tabular-nums">
            {formatTime(timeRemaining)}
          </p>
        </div>

        {/* Barre de Progression */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full rounded-full ${progressColor}`}
            style={progressStyle}
            aria-valuenow={progressPercentage}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>

        {/* Contrôles du Minuteur */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleResetTask}
            className="control-button flex items-center justify-center p-3 text-gray-500 hover:text-indigo-600 rounded-full transition duration-150"
            aria-label="Réinitialiser la tâche actuelle"
          >
            <Repeat2 size={32} />
          </button>

          <button
            onClick={handleToggleTimer}
            className={`control-button flex items-center justify-center rounded-full shadow-lg transform transition duration-200
              ${isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-indigo-500 hover:bg-indigo-600'}
              text-white w-24 h-24 text-2xl font-bold`}
            aria-label={isRunning ? 'Mettre en pause' : 'Démarrer le minuteur'}
          >
            {isRunning ? <Pause size={40} /> : <Play size={40} />}
          </button>

          <button
            onClick={handleSkipTask}
            className="control-button flex items-center justify-center p-3 text-gray-500 hover:text-indigo-600 rounded-full transition duration-150"
            aria-label="Passer à la tâche suivante"
          >
            <RotateCcw size={32} />
          </button>
        </div>
      </div>

      {/* --- Liste des Tâches (Playlist) --- */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-700 flex items-center">
            <List className="mr-2 w-6 h-6" />
            Séquence de Tâches
          </h2>
          <button
            onClick={() => setIsSetupOpen(prev => !prev)}
            className="p-2 bg-indigo-500 text-white rounded-xl shadow hover:bg-indigo-600 transition flex items-center text-sm font-medium"
            aria-label="Ouvrir les paramètres de la liste"
          >
            <Plus size={18} className="mr-1" />
            Ajouter
          </button>
        </div>

        {/* Modal d'ajout de tâche */}
        {isSetupOpen && (
          <form
            onSubmit={handleAddTask}
            className="bg-white p-4 rounded-xl shadow-lg mb-4 border border-indigo-200"
          >
            <h3 className="text-lg font-bold mb-3 text-indigo-600">Nouvelle Tâche</h3>
            <div className="mb-3">
              <label htmlFor="timer-name" className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                id="timer-name"
                type="text"
                value={newTimerName}
                onChange={(e) => setNewTimerName(e.target.value)}
                placeholder="Ex: Tâche Profonde ou Pause"
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="timer-duration" className="block text-sm font-medium text-gray-700">Durée (minutes)</label>
              <input
                id="timer-duration"
                type="number"
                value={newTimerDuration}
                onChange={(e) => setNewTimerDuration(parseInt(e.target.value))}
                min="1"
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex justify-between">
                <button
                type="submit"
                className="px-4 py-2 bg-indigo-500 text-white font-medium rounded-lg shadow hover:bg-indigo-600 transition"
                >
                Ajouter à la liste
                </button>
                <button
                    type="button"
                    onClick={handleResetCycle}
                    className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center"
                >
                    <RotateCcw size={16} className="mr-1"/> Réinitialiser Cycle
                </button>
            </div>
          </form>
        )}

        {/* Affichage de la liste */}
        <div className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <TaskItem key={task.id} task={task} index={index} />
            ))
          ) : (
            <p className="text-center text-gray-500 p-4 bg-white rounded-xl shadow">
              Ajoutez votre première tâche ci-dessus.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Injection de l'application dans la balise <div id="root">
const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<App />);
} else {
    console.error("Élément racine 'root' non trouvé dans le DOM.");
}

