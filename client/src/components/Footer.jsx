import React from 'react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <p>&copy; {new Date().getFullYear()} LupahTech solutions. X-POZ Community Reporting.</p>
                <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Empowering citizens to report anonymously.</p>
            </div>
        </footer>
    );
};

export default Footer;
