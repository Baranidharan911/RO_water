import React, { useState, useEffect } from 'react';
import { getAuth, updateEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';

const UserProfile = () => {
  const [userData, setUserData] = useState({});
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(''); // Add address state
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageURL, setProfileImageURL] = useState('');
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [error, setError] = useState('');
  const [modalImage, setModalImage] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'Users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setName(data.name);
          setEmail(data.email);
          setPhone(data.phone);
          setAddress(data.address); // Set address
          setProfileImageURL(data.profileImageURL);
          setDocuments(data.documents || []);
        } else {
          console.log('No such document!');
        }
      } else {
        navigate('/login');
      }
    };

    fetchUserData();
  }, [auth, navigate]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/dashboard');
    }
  }, [auth, navigate]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setName(userData.name);
    setEmail(userData.email);
    setPhone(userData.phone);
    setAddress(userData.address); // Reset address
    setProfileImageURL(userData.profileImageURL);
    setDocuments(userData.documents || []);
  };

  const handleSave = async () => {
    setError('');
    try {
      const user = auth.currentUser;

      if (user) {
        if (email !== user.email) {
          await updateEmail(user, email);
        }

        const userRef = doc(db, 'Users', user.uid);
        let newProfileImageURL = profileImageURL;
        const updatedDocuments = [...documents];

        if (profileImage) {
          const profileImageRef = ref(storage, `profileImages/${user.uid}/${profileImage.name}`);
          await uploadBytes(profileImageRef, profileImage);
          newProfileImageURL = await getDownloadURL(profileImageRef);
        }

        for (let i = 0; i < newDocuments.length; i++) {
          const documentRef = ref(storage, `documents/${user.uid}/doc${documents.length + i + 1}`);
          await uploadBytes(documentRef, newDocuments[i]);
          const documentURL = await getDownloadURL(documentRef);
          updatedDocuments.push({ name: `doc${documents.length + i + 1}`, url: documentURL });
        }

        const updatedData = {
          name,
          email,
          phone,
          address, // Update address
          documents: updatedDocuments,
        };

        if (newProfileImageURL) {
          updatedData.profileImageURL = newProfileImageURL;
        }

        await updateDoc(userRef, updatedData);

        setUserData({ name, email, phone, address, profileImageURL: newProfileImageURL, documents: updatedDocuments });
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Error updating profile. Please try again.');
    }
  };

  const handleDocumentChange = (e) => {
    setNewDocuments([...e.target.files]);
  };

  const handleDocumentClick = (url) => {
    setModalImage(url);
  };

  const handleCloseModal = () => {
    setModalImage(null);
  };

  return (
    <div className="profile-container">
      <h2>User Profile Form</h2>
      <div className="profile-pic">
        {profileImageURL ? (
          <img src={profileImageURL} alt="Profile" />
        ) : (
          <img src="https://via.placeholder.com/100" alt="Profile" />
        )}
      </div>
      {error && <p className="error-message">{error}</p>}
      <form className="profile-form">
        <div className="input-container">
          <input
            type="text"
            className="input-field"
            placeholder=" "
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!editing}
          />
          <label className="input-label">Name</label>
        </div>
        <div className="input-container">
          <input
            type="email"
            className="input-field"
            placeholder=" "
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!editing}
          />
          <label className="input-label">Email</label>
        </div>
        <div className="input-container">
          <input
            type="text"
            className="input-field"
            placeholder=" "
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!editing}
          />
          <label className="input-label">Phone</label>
        </div>
        <div className="input-container">
          <input
            type="text"
            className="input-field"
            placeholder=" "
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!editing}
          />
          <label className="input-label">Address</label>
        </div>
        <div className="input-container">
          <input
            type="file"
            className="input-field"
            onChange={(e) => setProfileImage(e.target.files[0])}
            disabled={!editing}
          />
          <label className="input-label">Profile Image</label>
        </div>
        <div className="input-container">
          <input
            type="file"
            className="input-field"
            multiple
            onChange={handleDocumentChange}
            disabled={!editing}
          />
          <label className="input-label">Documents</label>
        </div>
        <div className="document-names">
          {documents.length > 0 && documents.map((doc, index) => (
            <div key={index} className="document-name" onClick={() => handleDocumentClick(doc.url)}>{doc.name}</div>
          ))}
        </div>
        <div className="profile-buttons">
          {editing ? (
            <>
              <button type="button" onClick={handleSave}>Save</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <button type="button" onClick={handleEdit}>Edit Profile</button>
          )}
        </div>
      </form>
      {modalImage && (
        <div className="modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={handleCloseModal}>&times;</span>
            <img src={modalImage} alt="Document" />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
