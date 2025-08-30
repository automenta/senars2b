import React from 'react';
import {FaPlus} from 'react-icons/fa';
import ThemeSwitcher from './ThemeSwitcher';
import {useStore} from '../store';
import styles from './Header.module.css';

const Header: React.FC = () => {
    const {activeView, setIsModalOpen, theme, toggleTheme} = useStore();

    return (
        <header className={styles.header}>
            <h1>{activeView}</h1>
            <div className={styles.controls}>
                <ThemeSwitcher theme={theme} toggleTheme={toggleTheme}/>
                <button onClick={() => setIsModalOpen(true)} className={styles.addTaskBtn}>
                    <FaPlus/>
                    Add Task
                </button>
            </div>
        </header>
    );
};

export default Header;
