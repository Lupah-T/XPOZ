import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ReportForm from '../components/ReportForm';

const CreatePost = () => {
    return (
        <>
            <Header />
            <main className="container" style={{ flex: 1, paddingBottom: '3rem', maxWidth: '600px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>New Post</h2>
                <ReportForm />
            </main>
            <Footer />
        </>
    );
};

export default CreatePost;
