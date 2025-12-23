import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="footer" style={{ position: 'relative' }}>
            <div className="container">
                <p>&copy; {new Date().getFullYear()} LupahTech solutions. X-POZ Community Reporting.</p>
                <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Empowering citizens to report anonymously.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: '500', color: 'var(--primary)' }}>Created by Aizack (LupahTech Solutions)</p>
                <Link
                    to="/admin/login"
                    style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '10px',
                        fontSize: '0.6rem',
                        opacity: 0.2,
                        textDecoration: 'none',
                        color: 'inherit'
                    }}
                >
                    Admin Access
                </Link>
            </div>
        </footer>
    );
};

export default Footer;
