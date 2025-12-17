import React from 'react';
import Header from '../components/Header';
import ReportForm from '../components/ReportForm';

const CreatePost = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <main className="container" style={{ flex: 1, paddingBottom: '80px', maxWidth: '600px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>New Post</h2>
                <ReportForm />
            </main>
        </div>
    );
};

export default CreatePost;
