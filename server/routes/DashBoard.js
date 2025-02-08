// routes/api.js
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
// const StayDetails = require('../models/StayDetails');
const Resident = require('../models/newMemberResident');
// const HelpTopic = require('../models/HelpTopic');
const Ticket = require('../models/ticket');
const authMiddleware = require('../middleware/middleware');
const dayjs = require('dayjs');

const Hostels = require('../models/Hostel');
const filterPaymentsByCurrentMonth = require('../functions/filterCurrentmonthPayments');
const rentMapAmount = require('../functions/paymentfunction');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// const { totalPendingTickets, totalTickets } = require('../functions/TotalTickets');




// Fetch payments for a user
router.get('/payment/userPayments/:userId', async (req, res) => {
  try {
    const payments = await Payment.find({userId: req.params.userId,type:'rent'}).sort({ month: 1 });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).send('Internal Server Error');
  }
});
// update amount 
router.put('/updateAmount/:userId', async (req, res) => {
  try {
    const payments = await Payment.updateMany(  { userId: req.params.userId },  // Match all payments for this user
      { 
        rent: req.body.rent,
        amount: req.body.amount 
      });
      if (payments.matchedCount === 0) {
        return res.status(404).send('No payments found for this user');
      }
      res.json(payments);
  } catch (error) {
    res.json(error);
  }
})

router.put('/updateSuccesfulPaymentStatus/:userId',async(req,res)=>{
  try {
    const payments = await Payment.updateMany(  { userId: req.params.userId },  // Match all payments for this user
      { 
       status:"due",
       cash:false
      });
      if (payments.matchedCount === 0) {
        return res.status(404).send('No payments found for this user');
      }
      res.json(payments);
  } catch (error) {
    res.json(error);
  }
})


router.get('/payments',async(req,res)=>{
  try {
    const payments= await Payment.find();
    // await rentMapAmount();
    res.json(payments); 
  } catch (error) {
    console.log(error);
  }
})

router.get('/paymentsArray', async (req, res) => {
  try {
    // Get the list of resident IDs from the query parameter (assuming they are comma-separated)
    const paymentsIds = req.query.ids.split(',');

    // Find residents in the database whose IDs match the provided list
    const payments = await Payment.find({
      _id: { $in: paymentsIds }
    });

    // Return the list of residents
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ error: 'Failed to fetch Payments' });
  }
});



router.delete('/deletePayment/:paymentId',async(req,res)=>{
  try {
    const paymentId = req.params.paymentId
    const payment = await Payment.findById(paymentId);
    if(!payment){
      return res.status(404).send('Payment not found');
    } 
    const resident = await Resident.findById(payment.userId);
    if(!resident){
      return res.status(404).send('Resident not found');
    }
    resident.payments.pull(paymentId);
    await resident.save();
    await Payment.findByIdAndDelete(paymentId);
    await payment.save();
    res.json("payment deleted successfully")
  } catch (error) {
    console.log(error);
  }
})




// due payments
router.get('/duePayments',async(req,res)=>{
  try {
    const payments = await Payment.find({type:'dueCharge'});
    res.json(payments);
  } catch (error) {
    res.json(error);
  }
})
router.get('/payment/dueAmount/:residentId',async(req,res)=>{
  try {
    const payment = await Payment.findOne({userId:req.params.residentId,type:'dueCharge'})
    res.json(payment);
  } catch (error) {
   res.json(error); 
  }
})


// update dueAmount
router.put('/updateDueAmount/:id',async(req,res)=>{
  try {
    const payment = await Payment.findAndUpdate(req.params.id,{
      amount:req.body.amount
    },{new:true});
    res.json(payment);
  } catch (error) {
    res.json(error);
  }
}
)
router.put('/resident/updateDueAmount/:residentId',async(req,res)=>{
  try {
    const payment = await Payment.findOneAndUpdate({userId:req.params.residentId,type:'dueCharge'},{amount:req.body.amount},{new:true})
    res.json(payment);

  } catch (error) {
   res.json(error); 
  }
})

router.put('/payment/dueAmount/onlinePayed/:paymentId',async(req,res)=>{
  try {
    const paymentId= req.params.paymentId
    const maintainaceChargeStatus = req.body.maintainaceChargeStatus
    const depositStatus = req.body.depositStatus
    const extraDayPaymentAmountStatus = req.body.extraDayPaymentAmountStatus
    const duePayment = await Payment.findById(paymentId);
    const resident = await Resident.findById(duePayment.userId);
   
    let amountRecieved = 0;
    if(!duePayment){
      return res.status(404).json({message:'Payment not found'})
    }
    if(!resident.maintainaceChargeStatus){
      if(maintainaceChargeStatus){
        resident.maintainaceChargeStatus=true
        resident.living='current'
        amountRecieved=amountRecieved+resident.maintainaceCharge
      }
    }
if(!resident.depositStatus){
  if(depositStatus){
    resident.depositStatus=true
    resident.living='current'
    amountRecieved=amountRecieved+resident.deposit
  }
}
if(!resident.extraDayPaymentAmountStatus){
  if(extraDayPaymentAmountStatus){
    resident.extraDayPaymentAmountStatus=true
    resident.living='current'
    amountRecieved=amountRecieved+resident.extraDayPaymentAmount
  }
}

  if(depositStatus||extraDayPaymentAmountStatus||maintainaceChargeStatus){
    await generateMonthlyPayments(resident._id,resident.contractEndDate);
  }

    const newDueAmount = resident.dueAmount-amountRecieved
    resident.dueAmount=newDueAmount
    duePayment.amount=newDueAmount
    if(newDueAmount===0){
      duePayment.status='successful'
    }
    await resident.save();
    await duePayment.save();
    res.json(duePayment);
  } catch (error) {
    res.json(error)
  }
})

router.get('/payment/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
   
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/payment/user/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const resident = await Resident.find({
      payments: paymentId
    });
    
    res.json(resident);
 
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).send('Internal Server Error');
  }
});



// current month payment
router.get('/payment/currentmonth',async(req,res)=>{
  try {
       // Get the current date

       const currentDate = new Date();
       const date = dayjs(currentDate).startOf('month');
       const month = date.format('YYYY-MM');
       
   
     
   
       // Find payments where `date` is within the current month
       const payments = await Payment.find({
        month:month
       });
       res.json(payments);

  } catch (error) {
    res.status(500).json(error);
  }
})






router.put('/onlinePaymentSave/:paymentId', async (req, res) => {
  try {
    // const { userId, month, amount } = req.body;
    // const payment = await Payment.findOneAndUpdate(
    //   { userId, month },
    //   { status: 'successful', amount, date: new Date() },
    //   { new: true }
    //   );
    // res.status(201).json(payment);
    const payment = await Payment.findByIdAndUpdate(
      req.params.paymentId,
      { status: 'successful', cash:false },
      { new: true, },
      );
      

  
    res.json(`successfully saved ${payment}`);
  } catch (error) {
    console.error('Error making payment:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.put('/cashPayment/:id',async(req,res)=>{
  try {
      const paymentId = req.params.id
      const payment = await Payment.findByIdAndUpdate(paymentId,{
        cash:true,status:'successful'
      },{new:true})
    res.json({message:'successful through cash'});
  } catch (error) {
    console.error('Error making payment:', error);
    res.status(500).send('Internal Server Error');
  }
})
router.get('/currentMonthPayments/:hostelId',async(req,res)=>{
  try {
    // Step 1: Find users by hostelId and populate their payments
    const Residents = await Resident.find({ hostelId: req.params.hostelId }).populate('payments');

    // Step 2: Filter payments for each user to include only payments from the current month
    const usersWithCurrentMonthPayments = Residents.map(user => {
        const currentMonthPayments = filterPaymentsByCurrentMonth(user.payments);
      return currentMonthPayments
    });

    // Step 3: Send the filtered users and their current month payments as a response
    res.json(usersWithCurrentMonthPayments);

} catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
}
})


router.get('/monthPayments/:hostelId',async(req,res)=>{
  try {
    // Step 1: Find users by hostelId and populate their payments
    const Residents = await Resident.find({ hostelId: req.params.hostelId }).populate('payments');


  const userPayments = Residents.map(user=>{
    return user.payments;
  })
  res.json(userPayments);
    // Step 3: Send the filtered users and their current month payments as a response
   

} catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
}
})

router.get('/monthPayments/:hostelId/:month', async (req, res) => {
  try {
    const { hostelId, month } = req.params;

    // Find residents by hostelId and populate their payments
    const residents = await Resident.find({ hostelId,living:'current' })
      .populate({
        path: 'payments',
        match: { month }  // Filter payments by month
      });

    // Extract payments from residents
    const userPayments = residents.flatMap(resident => resident.payments);

    res.json(userPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Get user stay details
router.get('/stay-details', authMiddleware, async (req, res) => {
  try {
    const userId = req.user; // Extracted from auth middleware
    const details = await Resident.findById( userId );
    if (!details) {
      return res.status(404).json({ message: 'Stay details not found' });
    }
    res.json(details);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve stay details' });
  }
});


// Raise a support ticket
router.post('/raise-ticket', async (req, res) => {
  try {

    const { helpTopic, description, userId } = req.body;
    const userDetails = await Resident.findById(userId);
    if (!userDetails) {
      return res.status(404).json({ message: 'User details not found' });
    }
    const name = userDetails.name;
    const hostel = userDetails.hostel;
    const hostelId = userDetails.hostelId;
    const room = userDetails.roomNumber;
    


    if (!helpTopic || !description) {
      return res.status(400).json({ message: 'Help topic and description are required' });
    }

    const ticket = new Ticket({name, userId, hostel, room, helpTopic, description,hostelId });
    await ticket.save();
      const totalTickets = await Ticket.countDocuments({hostelId:hostelId});
       await Hostels.findByIdAndUpdate(hostelId,{totalTickets:totalTickets},{new:true});
       const totalPendingTickets = await Ticket.countDocuments({hostelId:hostelId},{status:'Open'});
       await Hostels.findByIdAndUpdate(hostelId,{totalPendingTickets:totalPendingTickets},{new:true});



   const Hostel = await Hostels.findById(hostelId);
    Hostel.managerTickets.push(ticket.id); 
    await Hostel.save();
    res.status(201).json(ticket);
   
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to raise a support ticket' });
  }
});



router.get('/oldTickets/:userid',async(req,res)=>{
  try {
    const userId = req.params.userid;
    const tickets = await Ticket.find({userId}).sort({createdAt:-1});
    res.json(tickets);
  } catch (error) {
    console.log(error)
  }
})

router.get('/monthlyPaymentDue/resident', async (req, res) => {
  try {
    // Step 1: Filter payments based on month, status, and type
    const payments = await Payment.find({ month: "2025-02", status: 'due', type: 'rent' });
    const userIds = payments.map(payment => payment.userId);

    // Step 2: Retrieve residents based on the filtered user IDs
    const residents = await Resident.find({ _id: { $in: userIds },living:'current' })
      .select('name roomNumber hostel  mobileNumber');

    // Step 3: Prepare resident data for Excel
    const residentData = residents.map(resident => ({
      Name: resident.name,
      Hostel: resident.hostel,
      RoomNumber: resident.roomNumber,
      DueAmount: payments.find(payment => payment.userId.toString() === resident._id.toString())?.amount || 0,
      mobileNo: resident.mobileNumber
    }));

    // Step 4: Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(residentData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Residents Due');

    // Step 5: Generate and send the Excel file
    const filePath = path.join(__dirname, 'dueAmountResident.xlsx');
    XLSX.writeFile(workbook, filePath);

    res.setHeader('Content-Disposition', 'attachment; filename=dueAmountResident.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.download(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        return res.status(500).json({ error: 'Error downloading the file' });
      }

      // Delete the file after sending
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    });
  } catch (error) {
    console.error("Error fetching residents:", error); // Log detailed error
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;


// functions
// generate monthly payments
async function generateMonthlyPayments (userId, contractEndDate){
  try {
    const resident = await Resident.findById(userId);
    const startDate = dayjs(resident.dateJoined).startOf('day');
    let currentDate;

    // Check if the resident joined on the 1st of the month
    if (startDate.date() === 1) {
      currentDate = startDate.startOf('month'); // Start from this month
    } else {
      currentDate = startDate.add(1, 'month').startOf('month'); // Start from the next month
    }

    // Generate payments based on the contract term
    for (let i = 0; i < resident.contractTerm; i++) {
      const month = currentDate.format('YYYY-MM');
      const existingPayment = await Payment.findOne({ userId, month });

      if (!existingPayment) {
        const payment = new Payment({
          userId,
          userName: resident.name,
          rent: resident.rent,
          amount: resident.rent,
          month,
          date: currentDate.toDate(),
          status: 'due',
          type: 'rent',
        });

        await payment.save();
        resident.payments.push(payment._id);
      }

      currentDate = currentDate.add(1, 'month');
    }

    // Save the resident with updated payments
    await resident.save();

    // Update the resident's contract term based on the number of payments generated
    await Resident.findByIdAndUpdate(userId, {
      contractTerm: resident.payments.length,
    }, { new: true });

  } catch (error) {
    console.log(error);
  }
};

