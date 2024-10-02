import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import './UserHistory.css';

const UserHistory = () => {
  const [devices, setDevices] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [currentUsage, setCurrentUsage] = useState(null);
  const [currentDate, setCurrentDate] = useState('');
  const [pastPlans, setPastPlans] = useState([]);
  const [error, setError] = useState('');
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userId = user.uid;
        try {
          const userRef = doc(db, 'Users', userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            await fetchUserDevices(userData.phone);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Error fetching user data.');
        }
      } else {
        setError('User not authenticated.');
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const fetchUserDevices = async (phone) => {
    try {
      const q = query(collection(db, 'Devices'), where('phone', '==', phone));
      const querySnapshot = await getDocs(q);
      const devices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDevices(devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Error fetching devices.');
    }
  };

  const fetchUsageHistory = async (deviceId) => {
    try {
      const deviceRef = doc(db, 'Devices', deviceId);
      const deviceSnap = await getDoc(deviceRef);
      if (deviceSnap.exists()) {
        const deviceData = deviceSnap.data();
        const history = deviceData.dailyUsage || {};
        const historyArray = Object.keys(history)
          .filter(date => !isNaN(Date.parse(date))) // Filter valid dates
          .map(date => ({ date, liters: (history[date] / 1000).toFixed(2) })); // Convert to liters
        setHistoryData(historyArray);
        setCurrentDevice(deviceId);
        setCurrentUsage((deviceData.liter / 1000).toFixed(2));
        setCurrentDate(new Date().toISOString().split('T')[0]);
        setPastPlans(deviceData.pastPlans || []);
      }
    } catch (error) {
      console.error('Error fetching usage history:', error);
      setError('Error fetching usage history.');
    }
  };

  const closeModal = () => {
    setCurrentDevice(null);
    setHistoryData([]);
    setCurrentUsage(null);
    setCurrentDate('');
    setPastPlans([]);
  };

  return (
    <div className="history-container">
      <h2>User Subscription History</h2>
      {error && <p className="error-message">{error}</p>}
      {devices.length > 0 ? (
        devices.map((device) => (
          <div key={device.id} onClick={() => fetchUsageHistory(device.id)} className="device-card">
            <h3>Device ID: {device.id}</h3>
            <p>Plan: {device.planName}</p>
          </div>
        ))
      ) : (
        <p>No devices found.</p>
      )}
      {currentDevice && (
        <>
          <div className="overlay" onClick={closeModal}></div>
          <div className="modal">
            <h3>Device ID: {currentDevice}</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Used Liters</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{currentDate}</td>
                    <td>{currentUsage}</td>
                  </tr>
                  {historyData.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.date}</td>
                      <td>{entry.liters}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Past Plans</h3>
            <div className="table-container">
              {pastPlans.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Plan Name</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Total Liters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastPlans.map((plan, index) => (
                      <tr key={index}>
                        <td>{plan.planName}</td>
                        <td>{new Date(plan.startDate).toLocaleDateString()}</td>
                        <td>{new Date(plan.endDate).toLocaleDateString()}</td>
                        <td>{(plan.totalLiter / 1000).toFixed(2)} L</td> {/* Convert ml to liters */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No past plans found.</p>
              )}
            </div>
            <button className="close-button" onClick={closeModal}>Close</button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserHistory;
