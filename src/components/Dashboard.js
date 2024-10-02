import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import './Dashboard.css';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [deviceIdInput, setDeviceIdInput] = useState('');
  const [searchDeviceId, setSearchDeviceId] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'Users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const phone = userSnap.data().phone;
            setUserPhone(phone);

            const q = query(collection(db, 'Devices'), where('phone', '==', phone));
            const querySnapshot = await getDocs(q);
            const devicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDevices(devicesData);
          }
        } catch (error) {
          console.error('Error fetching devices:', error);
        }
      } else {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const handleDeviceIdInputChange = (e) => {
    setDeviceIdInput(e.target.value);
    setErrorMessage('');
  };

  const handleSearchDeviceIdChange = (e) => {
    setSearchDeviceId(e.target.value);
    setErrorMessage('');
  };

  const handleAddDevice = async () => {
    if (deviceIdInput) {
      try {
        const deviceRef = doc(db, 'Devices', deviceIdInput);
        const deviceSnap = await getDoc(deviceRef);
        if (deviceSnap.exists()) {
          if (deviceSnap.data().phone && deviceSnap.data().phone !== userPhone) {
            setErrorMessage('Device already added by another account');
          } else {
            await setDoc(deviceRef, { phone: userPhone }, { merge: true });
            const updatedDevice = { id: deviceIdInput, ...deviceSnap.data(), phone: userPhone };
            setDevices([...devices, updatedDevice]);
            setDeviceIdInput('');
            setErrorMessage('');
          }
        } else {
          setErrorMessage('Device not found');
        }
      } catch (error) {
        console.error('Error adding device:', error);
        setErrorMessage('Error adding device');
      }
    }
  };

  const handleSearchDevice = async () => {
    if (searchDeviceId) {
      try {
        const deviceRef = doc(db, 'Devices', searchDeviceId);
        const deviceSnap = await getDoc(deviceRef);
        if (deviceSnap.exists() && deviceSnap.data().phone === userPhone) {
          setSearchResults([{ id: searchDeviceId, ...deviceSnap.data() }]);
          setErrorMessage('');
        } else {
          setErrorMessage('Unauthorized access to device data or device not found');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching device:', error);
        setErrorMessage('Error searching device');
        setSearchResults([]);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleUpgrade = async (deviceId, newPlan) => {
    try {
      const deviceRef = doc(db, 'Devices', deviceId);
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 5 * 60 * 1000); // 5 minutes from now
      const updatedData = {
        subscriptionStatus: 'active',
        planName: newPlan,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        subscription: true,
        totalLiter: newPlan === 'Silver' ? 3000 : 5000, // Example values in milliliters, adjust accordingly
      };

      await updateDoc(deviceRef, updatedData);
      setSelectedDevice({ ...selectedDevice, ...updatedData });

      console.log(`Plan upgraded to ${newPlan}. Subscription ends at ${endDate}`);

      // Schedule status change after 5 minutes
      setTimeout(async () => {
        console.log(`Changing subscription status for device ${deviceId} to inactive`);
        await updateDoc(deviceRef, { subscriptionStatus: 'inactive', subscription: false, totalLiter: 0 });
        setSelectedDevice((prevState) => ({ ...prevState, subscriptionStatus: 'inactive', subscription: false, totalLiter: 0 }));
        alert(`Subscription for device ${deviceId} has ended.`);
      }, 5 * 60 * 1000);

      alert(`Plan upgraded to ${newPlan}`);
    } catch (error) {
      console.error('Error upgrading plan:', error);
    }
  };

  const handleDeviceClick = async (device) => {
    try {
      const deviceRef = doc(db, 'Devices', device.id);
      const deviceSnap = await getDoc(deviceRef);
      if (deviceSnap.exists()) {
        setSelectedDevice({ id: device.id, ...deviceSnap.data() });
      }
    } catch (error) {
      console.error('Error fetching device data:', error);
    }
  };

  const handleBack = () => {
    setSelectedDevice(null);
    setSearchResults([]); // Clear search results on back
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleHistory = () => {
    navigate('/history');
  };

  const handlePlanSelect = (deviceId, plan) => {
    // Redirect to payment gateway with necessary details
    // Example: navigate(`/payment?device=${deviceId}&plan=${plan}`);
    alert(`Redirecting to payment gateway for Device ID: ${deviceId} and Plan: ${plan}`);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">Your Logo</div>
        <div className="header-buttons">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
          <button className="profile-btn" onClick={handleProfile}>Profile</button>
          <button className="history-btn" onClick={handleHistory}>History</button>
          <input
            type="text"
            placeholder="Enter Device ID to Add"
            value={deviceIdInput}
            onChange={handleDeviceIdInputChange}
          />
          <button className="add-device-btn" onClick={handleAddDevice}>Add Device</button>
          <input
            type="text"
            placeholder="Enter Device ID to Search"
            value={searchDeviceId}
            onChange={handleSearchDeviceIdChange}
          />
          <button className="search-btn" onClick={handleSearchDevice}>Search Device</button>
        </div>
      </header>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <div className="device-details">
        {selectedDevice ? (
          <>
            <div className="subscription-card">
              <p><strong>Device ID:</strong> {selectedDevice.id}</p>
              <p><strong>Plan Name:</strong> {selectedDevice.planName || "N/A"}</p>
              <p><strong>Start Date:</strong> {selectedDevice.startDate ? new Date(selectedDevice.startDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>End Date:</strong> {selectedDevice.endDate ? new Date(selectedDevice.endDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Total Liters:</strong> {(selectedDevice.totalLiter / 1000).toFixed(2)}L</p> {/* Convert to liters */}
              <p><strong>Used Liters:</strong> {(selectedDevice.liter / 1000).toFixed(2)}L</p> {/* Convert to liters */}
              <button className="back-btn" onClick={handleBack}>Back</button>
            </div>
            <div className="available-plans">
              <h2>Available Subscription Plans</h2>
              <div className="plan-cards">
                <div className="plan-card card-1" onClick={() => handlePlanSelect(selectedDevice.id, 'Bronze')}>
                  <div className="preview">
                    <h4 id="B">Bronze</h4>
                  </div>
                  <div className="content">
                    <h2>B</h2>
                    <h3>Bronze Plan</h3>
                    <p>$10/month</p>
                    <ul>
                      <li>Basic features</li>
                    </ul>
                    <button>Select Plan</button>
                  </div>
                </div>
                <div className="plan-card card-2" onClick={() => handlePlanSelect(selectedDevice.id, 'Silver')}>
                  <div className="preview">
                    <h4 id="S">Silver</h4>
                  </div>
                  <div className="content">
                    <h2>S</h2>
                    <h3>Silver Plan</h3>
                    <p>$20/month</p>
                    <ul>
                      <li>Intermediate features</li>
                    </ul>
                    <button>Select Plan</button>
                  </div>
                </div>
                <div className="plan-card card-3" onClick={() => handlePlanSelect(selectedDevice.id, 'Gold')}>
                  <div className="preview">
                    <h4 id="G">Gold</h4>
                  </div>
                  <div className="content">
                    <h2>G</h2>
                    <h3>Gold Plan</h3>
                    <p>$30/month</p>
                    <ul>
                      <li>All features</li>
                    </ul>
                    <button>Select Plan</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : searchResults.length > 0 ? (
          searchResults.map((device) => (
            <div key={device.id} className="device-id-card" onClick={() => handleDeviceClick(device)}>
              <p><strong>Device ID:</strong> {device.id}</p>
            </div>
          ))
        ) : (
          devices.map((device) => (
            <div key={device.id} className="device-id-card" onClick={() => handleDeviceClick(device)}>
              <p><strong>Device ID:</strong> {device.id}</p>
            </div>
          ))
        )}
      </div>
      {!selectedDevice && (
        <div className="available-plans">
          <h2>Available Subscription Plans</h2>
          <div className="plan-cards">
            <div className="plan-card card-1" onClick={() => handlePlanSelect('sample-device-id', 'Bronze')}>
              <div className="preview">
                <h4 id="B">Bronze</h4>
              </div>
              <div className="content">
                <h2>B</h2>
                <h3>Bronze Plan</h3>
                <p>$10/month</p>
                <ul>
                  <li>Basic features</li>
                </ul>
                <button>Select Plan</button>
              </div>
            </div>
            <div className="plan-card card-2" onClick={() => handlePlanSelect('sample-device-id', 'Silver')}>
              <div className="preview">
                <h4 id="S">Silver</h4>
              </div>
              <div className="content">
                <h2>S</h2>
                <h3>Silver Plan</h3>
                <p>$20/month</p>
                <ul>
                  <li>Intermediate features</li>
                </ul>
                <button>Select Plan</button>
              </div>
            </div>
            <div className="plan-card card-3" onClick={() => handlePlanSelect('sample-device-id', 'Gold')}>
              <div className="preview">
                <h4 id="G">Gold</h4>
              </div>
              <div className="content">
                <h2>G</h2>
                <h3>Gold Plan</h3>
                <p>$30/month</p>
                <ul>
                  <li>All features</li>
                </ul>
                <button>Select Plan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
