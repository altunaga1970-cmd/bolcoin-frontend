import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { GeoBlock } from '../common';
import './Layout.css';

/**
 * PublicLayout - Layout for public pages
 * Includes Header, Footer, and GeoBlocking wrapper
 */
function PublicLayout() {
  return (
    <GeoBlock>
      <div className="public-layout">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </GeoBlock>
  );
}

export default PublicLayout;
