import React, { useState, useEffect, useContext } from 'react';

import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  TextField
} from '@mui/material';
import api from '../../api/apiKey';
import AuthContext from '../context/AuthContext';

const ResidentDetails = ({ residentId, open, onClose }) => {
  const [resident, setResident] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openRoomSwapDialog, setOpenRoomSwapDialog] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [oldRoomId, setOldRoomId] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [openDeductionDialog, setOpenDeductionDialog] = useState(false);
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionReason, setDeductionReason] = useState('');
  const [deductionError, setDeductionError] = useState('');
  const [deductionSuccess, setDeductionSuccess] = useState(false);
  const [openContractDialog, setOpenContractDialog] = useState(false);
  const [extendedMonths, setExtendedMonths] = useState('');
  const [contractError, setContractError] = useState('');
  const [contractSuccess, setContractSuccess] = useState(false);

  const {user}= useContext(AuthContext);

  useEffect(() => {
    if (open && residentId) {
      setLoading(true);
      setResident(null);
      setPayments([]);
      
      // Fetch resident details
      api.get(`https://beiyo-admin.in/api/newResident/${residentId}`)
        .then(response => {
          setResident(response.data);
          // Fetch resident payments
          if (response.data.payments && response.data.payments.length > 0) {
            api.get(`https://beiyo-admin.in/api/dashboard/paymentsArray?ids=${response.data.payments.join(',')}`)
              .then(paymentResponse => {
                setPayments(paymentResponse.data);
                console.log(payments);
                setLoading(false);
              })
              .catch(error => {
                console.error('Error fetching payments:', error);
                setLoading(false);
              });
          } else {
            setPayments([]);
            setLoading(false);
          }
        })
        .catch(error => {
          console.error('Error fetching resident details:', error);
          setLoading(false);
        });
    }
  }, [residentId, open]);


  // Function to delete payment
const handleDeletePayment = (paymentId) => {
  setLoading(true);
  if(user.uniqueId==='B2'||user.uniqueId==='B4'||user.uniqueId==='B7'){
    api.delete(`https://beiyo-admin.in/api/dashboard/deletePayment/${paymentId}`)
    .then(response => { 
      setLoading(false);
    })
    .catch(error => {
      console.error('Error deleting payment:', error);
      setLoading(false);
    });
  }

};

// Function to mark payment as cash
const handleCashPayment = (paymentId) => {
  setLoading(true);
 if(user.uniqueId==='B2'||user.uniqueId==='B4'||user.uniqueId==='B7'){
  api.put(`https://beiyo-admin.in/api/dashboard/cashPayment/${paymentId}`)
  .then(response => {
    // Update the payment in the state
    setPayments(payments.map(payment => 
      payment._id === paymentId ? { ...payment, cash: true, status: 'successful' } : payment
    ));
    setLoading(false);
  })
  .catch(error => {
    console.error('Error updating payment to cash:', error);
    setLoading(false);
  });
 }else{
  alert('You are not authorized to perform this action.');
 }
};

// Function to mark payment as cash
const handleOnlinePayment = (paymentId) => {
  setLoading(true);
  if(user.uniqueId==='B2'||user.uniqueId==='B4'||user.uniqueId==='B7'){
    api.put(`https://beiyo-admin.in/api/dashboard/onlinePaymentSave/${paymentId}`)
    .then(response => {
      // Update the payment in the state
      setPayments(payments.map(payment => 
        payment._id === paymentId ? { ...payment, cash: false, status: 'successful' } : payment
      ));
      setLoading(false);
    })
    .catch(error => {
      console.error('Error updating payment to cash:', error);
      setLoading(false);
    });
  }else{
    alert('You are not authorized to perform this action.');
  }
};


  const handleRoomSwapOpen = () => {
    // Fetch available rooms when the dialog is opened
    api.get('https://beiyo-admin.in/api/rooms')
      .then(response => setRooms(response.data))
      .catch(error => console.error('Error fetching rooms:', error));
    setOpenRoomSwapDialog(true);
  };

  const handleRoomSwap = () => {
    if(user.uniqueId==='B3'||user.uniqueId==='B4'||user.uniqueId==='B7'){
      if (newRoomId) {
        api.put(`https://beiyo-admin.in/api/rooms/roomSwap/${residentId}`, {
          oldRoomId:resident.roomNumberId,
          newRoomId
        })
        .then(response => {
          console.log('Room swapped successfully:', response.data);
          setOpenRoomSwapDialog(false);
          onClose();  // Close the main dialog and refresh resident details
        })
        .catch(error => console.error('Error swapping rooms:', error));
      } else {
        console.error('Please select  new room.');
      }
    }
    else{
      alert('You are not authorized to perform this action.');
    }
  };

  const handleDeleteResident = () => {
    if(user.uniqueId==='B3'||user.uniqueId==='B4'||user.uniqueId==='B7'){
      if (residentId) {
        api.delete(`https://beiyo-admin.in/api/newResident/deleteResident/${residentId}`)
          .then(() => {
            setDeleteSuccess(true);
            onClose();  // Close the dialog after successful deletion
          })
          .catch(error => {
            setDeleteError('Failed to delete resident. Please try again.');
            console.error('Error deleting resident:', error);
          });
      }
    }else{
      alert('You are not authorized to perform this action.');
    }

  };

   // Open the Deduction dialog
   const handleOpenDeductionDialog = () => {
    setOpenDeductionDialog(true);
  };

  // Close the Deduction dialog
  const handleCloseDeductionDialog = () => {
    setOpenDeductionDialog(false);
    setDeductionAmount('');
    setDeductionReason('');
    setDeductionError('');
    setDeductionSuccess(false);
  };
  // Handle deposit deduction
  const handleSubmitDeduction = () => {
    if (!deductionAmount || !deductionReason) {
      setDeductionError('Please provide both amount and reason.');
      return;
    }

    if (user.uniqueId === 'B3' || user.uniqueId === 'B4'||user.uniqueId==='B7'||user.uniqueId==='B6') {
      setLoading(true);
      api.post(`https://beiyo-admin.in/api/newResident/deduct-deposit/${residentId}`, {
        amount: deductionAmount,
        reason: deductionReason
      })
        .then(response => {
          setLoading(false);
          setDeductionSuccess(true);
          handleDeductionClose();  // Close the dialog after success
          // Optionally, refresh the resident details to show updated deposit and deductions
          setResident(prevResident => ({
            ...prevResident,
            deposit: response.data.remainingDeposit,
            deductions: response.data.deductions
          }));
        })
        .catch(error => {
          console.error('Error deducting deposit:', error);
          setLoading(false);
          setDeductionError('Failed to process deduction. Please try again.');
        });
    } else {
      alert('You are not authorized to perform this action.');
    }
  };

    // Function to open the contract extension dialog
    const handleOpenContractDialog = () => {
      setOpenContractDialog(true);
      setContractError('');
      setContractSuccess(false);
    };
  
    // Function to close the contract extension dialog
    const handleCloseContractDialog = () => {
      setOpenContractDialog(false);
      setExtendedMonths('');
    };
  
    // Function to handle contract extension
    const handleExtendContract = () => {
      if (!extendedMonths) {
        setContractError('Please enter the number of months to extend.');
        return;
      }
  
      setLoading(true);
      api
        .put(
          `https://beiyo-admin.in/api/newResident/extendContract/${residentId}`,
          { extendedMonth: extendedMonths }
        )
        .then((response) => {
          setLoading(false);
          setContractSuccess(true);
          setResident((prevResident) => ({
            ...prevResident,
            contractEndDate: response.data.newContractEndDate,
          }));
        })
        .catch((error) => {
          console.error('Error extending contract:', error);
          setLoading(false);
          setContractError('Failed to extend the contract. Please try again.');
        });
    };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Resident Details</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <CircularProgress />
            </Box>
          ) : resident ? (
            <Box>
              <Typography variant="h6">{resident.name}</Typography>
              <Typography color="text.secondary">
                id: {resident._id}
              </Typography>
              <Typography color="text.secondary">
                Email: {resident.email}
              </Typography>
              <Typography color="text.secondary">
                Mobile Number: {resident.mobileNumber}
              </Typography>
              <Typography color="text.secondary">
                Address: {resident.address}
              </Typography>
              <Typography color="text.secondary">
                Parents' Name: {resident.parentsName}
              </Typography>
              <Typography color="text.secondary">
                Parents' Mobile No: {resident.parentsMobileNo}
              </Typography>
              <Typography color="text.secondary">
                Hostel: {resident.hostel}
              </Typography>
              <Typography color="text.secondary">
                Room Number: {resident.roomNumber}
              </Typography>
              <Typography color="text.secondary">
                Date Joined: {new Date(resident.dateJoined).toLocaleDateString()}
              </Typography>
              <Typography color="text.secondary">
                Contract End Date: {new Date(resident.contractEndDate).toLocaleDateString()}
              </Typography>
              <Typography color="text.secondary">
                Rent: {resident.rent}
              </Typography>
              <Typography style={{display:"flex",justifyContent:"space-between",alignItems:"center"}} color="text.secondary">
                Deposit: {resident.deposit}
                <Button variant="contained" color="warning" onClick={handleOpenDeductionDialog} sx={{ mt: 3 }}>
                Deduct Deposit
              </Button>
              </Typography>
              <Typography color="text.secondary">
                Maintenance Charge: {resident.maintenanceCharge}
              </Typography>
              <Typography color="text.secondary">
                Form Fee: {resident.formFee}
              </Typography>
              <Typography color="text.secondary">
                Due Amount: {resident.dueAmount}
              </Typography>

              {/* Display resident images */}
              <Box sx={{ mt: 2 }}>
                {resident.imageUrl && <img src={resident.imageUrl} alt={`${resident.name} - Profile`} style={{ width: '100%', height: 'auto' }} />}
                {resident.aadhaarCardUrl && <img src={resident.aadhaarCardUrl} alt={`${resident.name} - Aadhaar Card`} style={{ width: '100%', height: 'auto', marginTop: '10px' }} />}
              </Box>

              {/* Display payments */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Payments:
              </Typography>
              {payments.length > 0 ? (
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Date</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Amount</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Rent</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Additional Charge</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Type</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>Cash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment._id}>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(payment.date).toLocaleDateString()}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.amount}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.rent}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.additionalCharge}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.status}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.type}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{payment.cash ? 'Yes' : 'No'}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => handleDeletePayment(payment._id)}
          disabled={loading}
        >
          Delete
        </Button>
      </td>
      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => handleCashPayment(payment._id)}
          disabled={payment.status === 'successful'}
        >
           Cash Payed
        </Button>
      </td>
      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={() => handleOnlinePayment(payment._id)}
          disabled={payment.status === 'successful'}
        >
          Online Payed
        </Button>
      </td>
                         

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              ) : (
                <Typography color="text.secondary">No payments available.</Typography>
              )}

              {/* Swap Room Button */}
              <Button variant="contained" color="primary" onClick={handleRoomSwapOpen} sx={{ mt: 3 }}>
                Swap Room
              </Button>
              <Typography color="text.secondary">
                Contract End Date:{' '}
                {new Date(resident.contractEndDate).toLocaleDateString()}
              </Typography>
        {/* //      <Button
                variant="contained"
                color="primary"
                onClick={handleOpenContractDialog}
                sx={{ mt: 3 }}
              >
                Extend Contract
              </Button> */}
            </Box>
          ) : (
            <Typography color="text.secondary">No resident data available.</Typography>
          )}

          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}

          {deleteSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Resident deleted successfully.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">Close</Button>
          <Button
            color="error"
            onClick={handleDeleteResident}
            disabled={loading}
          >
            Delete Resident
          </Button>
        </DialogActions>
      </Dialog>

      {/* Room Swap Dialog */}
      <Dialog open={openRoomSwapDialog} onClose={() => setOpenRoomSwapDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Swap Room</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* <FormControl fullWidth>
              <InputLabel>Old Room</InputLabel>
              <Select
                value={oldRoomId}
                onChange={(e) => setOldRoomId(e.target.value)}
                label="Old Room"
              >
                {rooms.map(room => (
                  <MenuItem key={room._id} value={room._id}>
                    {room.roomNumber} - {room.hostel}
                  </MenuItem>
                ))}
              </Select>
            </FormControl> */}
            <p>Your old Room: {resident&&resident.roomNumber}</p>
            <FormControl fullWidth>
              <InputLabel>New Room</InputLabel>
              <Select
                value={newRoomId}
                onChange={(e) => setNewRoomId(e.target.value)}
                label="New Room"
              >
                {rooms.map(room => (
                  <MenuItem key={room._id} value={room._id}>
                    {room.roomNumber} - {room.hostel}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoomSwapDialog(false)} color="primary">Cancel</Button>
          <Button onClick={handleRoomSwap} color="secondary">Swap Room</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openDeductionDialog} onClose={handleCloseDeductionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Deduct Deposit</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Amount"
              value={deductionAmount}
              onChange={(e) => setDeductionAmount(e.target.value)}
              fullWidth
              type="number"
              required
            />
            <TextField
              label="Reason"
              value={deductionReason}
              onChange={(e) => setDeductionReason(e.target.value)}
              fullWidth
              required
            />
          </Box>
          {deductionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deductionError}
            </Alert>
          )}

          {deductionSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Deduction processed successfully.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeductionDialog} color="primary">Cancel</Button>
          <Button onClick={handleSubmitDeduction} color="secondary" disabled={loading}>
            Deduct
          </Button>
        </DialogActions>
      </Dialog>
       {/* Contract Extension Dialog */}
       <Dialog open={openContractDialog} onClose={handleCloseContractDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Extend Contract</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Extend by (months)"
              value={extendedMonths}
              onChange={(e) => setExtendedMonths(e.target.value)}
              fullWidth
              type="number"
              required
            />
          </Box>
          {contractError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {contractError}
            </Alert>
          )}
          {contractSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Contract extended successfully.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContractDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleExtendContract}
            color="secondary"
            disabled={loading}
          >
            Extend
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ResidentDetails;
