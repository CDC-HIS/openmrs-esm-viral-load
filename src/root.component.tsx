import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useLeftNav } from '@openmrs/esm-framework';
import styles from './root.scss';
import LeftPanel from './components/side-menu/left-pannel.component';
// import Ncd from './ncd';

const Root: React.FC = () => {
  const spaBasePath = window.spaBase;

  useLeftNav({
    name: 'ncd-left-panel-slot',
    basePath: spaBasePath,
  });

  return (
    <BrowserRouter basename={spaBasePath}>
      <LeftPanel />
      <main className={styles.container}>
        <Routes>{/* <Route path="/" element={<Ncd />} /> */}</Routes>
      </main>
    </BrowserRouter>
  );
};

export default Root;
