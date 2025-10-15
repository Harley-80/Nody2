import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header.jsx';
import Footer from '../Footer.jsx';
import PromoBanner from '../PromoBanner.jsx';

const Layout = () => {
    return (
        <div className="layout d-flex flex-column min-vh-100">
            <PromoBanner />
            <Header />
            <main className="flex-grow-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
