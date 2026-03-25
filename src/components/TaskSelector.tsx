import { useState, useRef, useEffect } from 'react';
import { PRESET_TASKS } from '../types';

interface Props {
  value: string;
  onChange: (value: string) => void;
  customTasks: string[];
  onSaveCustomTask: (task: string) => void;
}

export function TaskSelector({ value, onChange, customTasks, onSaveCustomTask }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allPresets = [
    ...PRESET_TASKS.Design,
    ...PRESET_TASKS.General,
    ...customTasks,
  ];

  const isCustom = value && !allPresets.includes(value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDesign = PRESET_TASKS.Design.filter((t) =>
    t.toLowerCase().includes(filter.toLowerCase())
  );
  const filteredGeneral = PRESET_TASKS.General.filter((t) =>
    t.toLowerCase().includes(filter.toLowerCase())
  );
  const filteredCustom = customTasks.filter((t) =>
    t.toLowerCase().includes(filter.toLowerCase())
  );

  function selectTask(task: string) {
    onChange(task);
    setFilter('');
    setIsOpen(false);
    setShowSavePrompt(false);
  }

  function handleInputChange(val: string) {
    setFilter(val);
    onChange(val);
    setIsOpen(true);
    setShowSavePrompt(false);
  }

  function handleInputBlur() {
    // Delay to allow click events on dropdown items
    setTimeout(() => {
      if (isCustom && value.trim()) {
        setShowSavePrompt(true);
      }
    }, 200);
  }

  return (
    <div className="task-selector" ref={containerRef}>
      <div className="task-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          placeholder="Select or type a task..."
          value={isOpen ? filter || value : value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setIsOpen(true);
            setFilter('');
          }}
          onBlur={handleInputBlur}
          className="task-input"
        />
        <button
          type="button"
          className="task-dropdown-toggle"
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          tabIndex={-1}
        >
          ▾
        </button>
      </div>

      {isOpen && (
        <div className="task-dropdown">
          {filteredDesign.length > 0 && (
            <div className="task-group">
              <div className="task-group-label">Design</div>
              {filteredDesign.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`task-option ${t === value ? 'selected' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectTask(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          {filteredGeneral.length > 0 && (
            <div className="task-group">
              <div className="task-group-label">General</div>
              {filteredGeneral.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`task-option ${t === value ? 'selected' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectTask(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          {filteredCustom.length > 0 && (
            <div className="task-group">
              <div className="task-group-label">Custom</div>
              {filteredCustom.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`task-option ${t === value ? 'selected' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectTask(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showSavePrompt && isCustom && (
        <div className="save-custom-task">
          <span>Save "{value}" for future use?</span>
          <button
            type="button"
            onClick={() => {
              onSaveCustomTask(value);
              setShowSavePrompt(false);
            }}
          >
            Save
          </button>
          <button type="button" onClick={() => setShowSavePrompt(false)}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
