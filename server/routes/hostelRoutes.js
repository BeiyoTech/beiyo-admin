// routes/hostelRoutes.js
const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Resident = require('../models/newMemberResident');
const Payment = require('../models/Payment');
const moment = require('moment');


// 1) issue tickets  Routes - 2 routes
// admin tickets
router.get('/adminTickets/:hostelId',async(req,res)=>{
  try {
    const hostel = await Hostel.findById(req.params.hostelId).populate('adminTickets');
    if(hoste===null){
      return res.status(404).json({message: "No hostel found"})
    }
    const adminTickets = hostel.adminTickets;
   
    
    res.status(200).json(adminTickets);

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
})

// manager tickets
router.get('/managerTickets/:hostelId',async(req,res)=>{
  try {
    const hostel = await Hostel.findById(req.params.hostelId).populate('managerTickets');
    if(hostel===null){
      return res.status(404).json({message: "No hostel found"})
    }
    const managerTickets = hostel.managerTickets;
   
   
    res.status(200).json(managerTickets);

  } catch (error) {
   console.error('Error fetching ticket details:', error);
    res.status(500).json({ message: 'Server error' });
  }
})

// 2) get update delete hostels routes - 6 hostels
// Get all hostels
router.get('/', async (req, res) => {
  try {
  // await  totalRooms();
  // await  totalBeds();
  // await mappingResidentToHostel();
  const { page = 1, limit = 10  } = req.params;
  const hostels = await Hostel.find()
  .select('-totalTenants -totalTickets -totalPendingTickets -totalClosedTickets -totalRooms -totalBeds -managerTickets -adminTickets -residents -amenities -ownerRent -monthlyExpenses' )
  .sort({ siteTotalRemainingBeds: -1, name: 1 })
  .skip((page - 1) * limit)
  .limit(parseInt(limit));
    res.json(hostels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single hostel
router.get('/:id', getHostel, (req, res) => {
  // totalRemainingBeds(req.params.id);
  res.json(res.hostel);
});

// update hostel details
router.put('/:id', async (req, res) => {
  try {
    const hostelId = req.params.id;
    
    // Extract the data to update from the request body
    const updateData = req.body;

    // Find the resident by ID and update it with the provided data
    const updatedHostel = await Hostel.findByIdAndUpdate(
      hostelId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedHostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    res.status(200).json({
      message: 'Hostel updated successfully',
      data: updatedHostel,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating hostel', error: error.message });
  }
});

// Create a new hostel
router.post('/', async (req, res) => {
  const hostel = new Hostel({
    name: req.body.name,
    location: req.body.location,
    locationLink:req.body.locationLink,
    price:req.body.price,
    image:req.body.image,
    image2:req.body.image2,
    image3:req.body.image3,
    single:req.body.single,
    singlePrice:req.body.singlePrice,
    doublePrice:req.body.doublePrice,
    triplePrice:req.body.triplePrice,
    nearby1:req.body.nearby1,
    nearby2:req.body.nearby2,
    nearby3:req.body.nearby3,
    nearby1distance:req.body.nearby1distance,
    nearby2distance:req.body.nearby2distance,
    nearby3distance:req.body.nearby3distance,
    hostelType:req.body.hostelType
  });

  try {
    const newHostel = await hostel.save();
    res.status(201).json(newHostel);
  } catch (err) {
    res.status(400).json({ message: err.message });
    console.log(err);
  }
});

// Delete a hostel
router.delete('/:id', getHostel, async (req, res) => {
  try {
    await res.hostel.remove();
    res.json({ message: 'Hostel deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get available rooms of specific hostel
router.get('/:hostelId/remainingCapacityRooms', async (req, res) => {
  try {
    // Find the hostel by ID
    const hostel = await Hostel.findById(req.params.hostelId);

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    // Find rooms belonging to the hostel with remaining capacity greater than 0
    const roomsWithCapacity = await Room.find({
      hostelId: hostel._id,
      remainingCapacity: { $gt: 0 }
    });

    res.status(200).json(roomsWithCapacity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// 3) Specfic hostel Payment Routes - 4 routes
// current month rent of specific hostels
router.get('/rent/current-month', async (req, res) => {
  try {
    const currentMonth = moment().format('YYYY-MM');

    console.log("Current Month:", currentMonth);

    const rentAndProfitData = await Payment.aggregate([
      {
        $facet: {
          // Calculate expected rent
          expectedRent: [
            {
              $match: {
                month: currentMonth,
                type: 'rent',
              },
            },
            {
              $lookup: {
                from: 'residents',
                let: { residentId: '$userId' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$_id', '$$residentId'] } } },
                  { $match: { living: 'current' } }, // Only current residents
                ],
                as: 'userInfo',
              },
            },
            { $unwind: '$userInfo' },
            {
              $group: {
                _id: '$userInfo.hostelId',
                hostel: { $first: '$userInfo.hostel' },
                expectedRent: { $sum: '$amount' },
              },
            },
          ],

          // Calculate total successful rent
          totalSuccessfullRent: [
            {
              $match: {
                month: currentMonth,
                type: 'rent',
                status: 'successful',
              },
            },
            {
              $lookup: {
                from: 'residents',
                let: { residentId: '$userId' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$_id', '$$residentId'] } } },
                  { $match: { living: 'current' } },
                ],
                as: 'userInfo',
              },
            },
            { $unwind: '$userInfo' },
            {
              $group: {
                _id: '$userInfo.hostelId',
                hostel: { $first: '$userInfo.hostel' },
                totalSuccessfullRent: { $sum: '$amount' },
              },
            },
          ],
        },
      },

      // Merge the expectedRent and totalSuccessfullRent results
      {
        $project: {
          combinedData: {
            $concatArrays: ['$expectedRent', '$totalSuccessfullRent'],
          },
        },
      },
      { $unwind: '$combinedData' },

      // Group by hostel to merge duplicates and sum the values
      {
        $group: {
          _id: '$combinedData._id',
          hostel: { $first: '$combinedData.hostel' },
          expectedRent: { $sum: '$combinedData.expectedRent' },
          totalSuccessfullRent: { $sum: '$combinedData.totalSuccessfullRent' },
        },
      },

      {
        $lookup: {
          from: 'hostels',
          localField: '_id',
          foreignField: '_id',
          as: 'hostelInfo',
        },
      },
      {
        $unwind: {
          path: '$hostelInfo',
          preserveNullAndEmptyArrays: false,
        },
      },

      // Lookup room details to calculate total capacity and room prices
      {
        $lookup: {
          from: 'rooms',
          localField: 'hostelInfo.rooms', // Array of room ObjectIDs in the hostel model
          foreignField: '_id',
          as: 'roomDetails',
        },
      },

      // Calculate total capacity and total room price
      {
        $addFields: {
          totalExpectedCostFromHostel: {
            $sum: {
              $map: {
                input: '$roomDetails',
                as: 'room',
                in: {
                  $multiply: [
                    { $toDouble: '$$room.price' }, 
                    { $toDouble: '$$room.capacity' }
                  ],
                },
              },
            },
          },
        },
      }, 
      // Access monthly expenses within hostelInfo and get the totalCost for current month
      {
        $addFields: {
          currentMonthExpenses: {
            $first: {
              $filter: {
                input: '$hostelInfo.monthlyExpenses',
                as: 'expense',
                cond: { 
                  $eq: ['$$expense.month', currentMonth] 
                }
              }
            }
          }
        }
      },
      

      {
        $addFields: {
          ownerRent: '$hostelInfo.ownerRent',
          totalExpenses:'$currentMonthExpenses.totalCost',
          grossProfit: {
            $subtract: ['$totalSuccessfullRent', '$hostelInfo.ownerRent'],
          },
          occupancyRate: {
            $cond: {
              if: { $gt: ['$totalExpectedCostFromHostel', 0] },
              then: { $multiply: [{ $divide: ['$totalSuccessfullRent', '$totalExpectedCostFromHostel'] }, 100] },
              else: 0,
            },
          },
          rentDue: {
            $subtract: ['$expectedRent', '$totalSuccessfullRent'],
          },
          netProfit: {
            $subtract: [
              { $subtract: ['$totalSuccessfullRent', '$hostelInfo.ownerRent'] }, // Gross profit
              '$currentMonthExpenses.totalCost', // Subtract total cost from monthly expenses
            ],
          },
        },
      },

      // Select only the required fields
      {
        $project: {
          _id: 1,
          hostel: 1,
          ownerRent: 1,
          grossProfit: 1,
          totalSuccessfullRent: 1,
          occupancyRate: 1,
          rentDue: 1,
          expectedRent: 1,
          totalExpectedCostFromHostel: 1,
          netProfit:1,
          totalExpenses:1,
        },
      },
    ]);

    res.json(rentAndProfitData);
  } catch (error) {
    console.error("Error fetching rent and gross profit data:", error);
    res.status(500).json({ message: error.message });
  }
});





// Get expected rent for each hostel for the next month
router.get('/rent/next-month-expected', async (req, res) => {
  try {
    const startOfNextMonth = moment().add(1, 'month').startOf('month').toDate();
    const endOfNextMonth = moment().add(1, 'month').endOf('month').toDate();

    const expectedRentNextMonth = await Payment.aggregate([
      {
        $match: {
          date: { $gte: startOfNextMonth, $lte: endOfNextMonth },
          type: 'rent',
        },
      },
      {
        $lookup: {
          from: 'residents',
          let: { residentId: '$userId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$residentId'] } } },
            // Add additional conditions here
            { $match: { living:"current" } } // Example condition: only include active residents
          ],
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $group: {
          _id: '$userInfo.hostelId',
          hostel: { $first: '$userInfo.hostel' },
          expectedRent: { $sum: '$amount' },
        },
      },
    ]);

    res.json(expectedRentNextMonth);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get total rent for each hostel for a specified past month
router.get('/rent/past-months', async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Please provide both month and year as query parameters.' });
    }

    // Set start and end dates for the specified month and year
    const startOfMonth = moment().set({ year, month: month - 1 }).startOf('month').toDate();
    const endOfMonth = moment().set({ year, month: month - 1 }).endOf('month').toDate();

    const rentAndProfitData = await Payment.aggregate([
      {
        $facet: {
          // Calculate expected rent
          expectedRent: [
            {
              $match: {
                date: { $gte: startOfMonth, $lte: endOfMonth },
                type: 'rent',
              },
            },
            {
              $lookup: {
                from: 'residents',
                let: { residentId: '$userId' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$_id', '$$residentId'] } } },
                  { $match: { living: 'current' } }, // Only current residents
                ],
                as: 'userInfo',
              },
            },
            { $unwind: '$userInfo' },
            {
              $group: {
                _id: '$userInfo.hostelId',
                hostel: { $first: '$userInfo.hostel' },
                expectedRent: { $sum: '$amount' },
              },
            },
          ],

          // Calculate total successful rent
          totalSuccessfullRent: [
            {
              $match: {
                date: { $gte: startOfMonth, $lte: endOfMonth },
                type: 'rent',
                status: 'successful',
              },
            },
            {
              $lookup: {
                from: 'residents',
                let: { residentId: '$userId' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$_id', '$$residentId'] } } },
                  { $match: { living: 'current' } },
                ],
                as: 'userInfo',
              },
            },
            { $unwind: '$userInfo' },
            {
              $group: {
                _id: '$userInfo.hostelId',
                hostel: { $first: '$userInfo.hostel' },
                totalSuccessfullRent: { $sum: '$amount' },
              },
            },
          ],
        },
      },

      // Merge the expectedRent and totalSuccessfullRent results
      {
        $project: {
          data: {
            $map: {
              input: {
                $setUnion: ['$expectedRent', '$totalSuccessfullRent'],
              },
              as: 'item',
              in: {
                _id: '$$item._id',
                hostel: '$$item.hostel',
                expectedRent: {
                  $ifNull: [
                    {
                      $arrayElemAt: [
                        '$expectedRent.expectedRent',
                        { $indexOfArray: ['$expectedRent._id', '$$item._id'] },
                      ],
                    },
                    0,
                  ],
                },
                totalSuccessfullRent: {
                  $ifNull: [
                    {
                      $arrayElemAt: [
                        '$totalSuccessfullRent.totalSuccessfullRent',
                        { $indexOfArray: ['$totalSuccessfullRent._id', '$$item._id'] },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      // Flatten and calculate derived fields
      { $unwind: '$data' },
      {
        $lookup: {
          from: 'hostels',
          localField: 'data._id',
          foreignField: '_id',
          as: 'hostelInfo',
        },
      },
      {
        $unwind: {
          path: '$hostelInfo',
          preserveNullAndEmptyArrays: false, // Ensure matching hostels only
        },
      },
      {
        $addFields: {
          'data.ownerRent': '$hostelInfo.ownerRent',
          'data.grossProfit': {
            $subtract: ['$data.totalSuccessfullRent', '$hostelInfo.ownerRent'],
          },
          'data.occupancyRate': {
            $cond: {
              if: { $gt: ['$data.expectedRent', 0] },
              then: { $multiply: [{ $divide: ['$data.totalSuccessfullRent', '$data.expectedRent'] }, 100] },
              else: 0,
            },
          },
          'data.rentDue': {
            $subtract: ['$data.expectedRent', '$data.totalSuccessfullRent'],
          },
        },
      },
      {
        $replaceRoot: { newRoot: '$data' },
      },
    ]);

    res.json(rentAndProfitData);
  } catch (error) {
    console.error("Error fetching past month rent data:", error);
    res.status(500).json({ message: error.message });
  }
});


// payment check of specific month of specific each hostel
router.get('/paymentCheck/:hostelId', async (req,res)=>{
  try {
   const allMonthPayments = [];
   const month = req.body.month;
   const hostelId = req.params.hostelId
   
   const Residents = await Resident.find({hostelId:hostelId});
   if(Residents===null){
     return res.status(404).json({message: "No residents found"})
   }
  for(const Resident of Residents){
   const Payments = await Payment.find({userId:Resident._id ,month:month});
   allMonthPayments.push(Payments);
  }
   res.status(200).json(allMonthPayments);
  } catch (error) {
   res.status(500).json(error);
  }
 });

// 4) Ammenties routes - 2 routes
// Route to add common amenities to all hostels
router.post('/common-amenities', async (req, res) => {
  const { amenities } = req.body; // New amenities from the request body (expected to be an array)

  if (!amenities || !Array.isArray(amenities)) {
    return res.status(400).json({ message: "Amenities must be provided as an array." });
  }

  try {
    // Update all hostels to include the new amenities without duplicates
    const result = await Hostel.updateMany(
      {},
      {
        $addToSet: { amenities: { $each: amenities } },
      }
    );

    res.status(200).json({
      message: "Common amenities added to all hostels successfully.",
      modifiedCount: result.modifiedCount, // Number of hostels updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while adding common amenities.", error });
  }
});

// Route to add amenities to an existing hostel
router.post('/hostels/:id/amenities', async (req, res) => {
  const { id } = req.params; // Hostel ID from the URL
  const { amenities } = req.body; // New amenities from the request body (expected to be an array)

  if (!amenities || !Array.isArray(amenities)) {
    return res.status(400).json({ message: "Amenities must be provided as an array." });
  }

  try {
    // Find the hostel by ID
    const hostel = await Hostel.findById(id);

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found." });
    }

    // Add new amenities to the existing list, ensuring no duplicates
    hostel.amenities = [...new Set([...hostel.amenities, ...amenities])];

    // Save the updated hostel document
    await hostel.save();

    res.status(200).json({ message: "Amenities added successfully.", hostel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while adding amenities.", error });
  }
});

// POST: Add monthly expenses
router.post('/:hostelId/expenses', async (req, res) => {
  const { hostelId } = req.params;
  const { month, maintenanceCost, utilityCost, kapex } = req.body;

  try {
    const totalCost = maintenanceCost + utilityCost;
    const newExpense = { month, maintenanceCost, utilityCost, totalCost,kapex };

    const updatedHostel = await Hostel.findByIdAndUpdate(
      hostelId,
      { $push: { monthlyExpenses: newExpense } },
      { new: true }
    );

    res.status(200).json({ message: 'Expense added successfully!', data: updatedHostel });
  } catch (error) {
    res.status(500).json({ message: 'Error adding expense', error });
  }
});

// PUT: Update a specific month's expenses
router.put('/:hostelId/expenses/:month', async (req, res) => {
  const { hostelId, month } = req.params;
  const { maintenanceCost, utilityCost,kapex } = req.body;

  try {
    const totalCost = maintenanceCost + utilityCost;

    const updatedHostel = await Hostel.updateOne(
      { _id: hostelId, "monthlyExpenses.month": month },
      { $set: { "monthlyExpenses.$": { month, maintenanceCost, utilityCost, totalCost, kapex } } }
    );

    res.status(200).json({ message: 'Expense updated successfully!', data: updatedHostel });
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense', error });
  }
});

// GET: Retrieve all monthly expenses
router.get('/:hostelId/expenses', async (req, res) => {
  const { hostelId } = req.params;

  try {
    const hostel = await Hostel.findById(hostelId).select('monthlyExpenses');
    res.status(200).json({ message: 'Expenses retrieved successfully!', data: hostel.monthlyExpenses });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving expenses', error });
  }
});

// Middleware function to get hostel by ID
async function getHostel(req, res, next) {
  let hostel;
  try {
    hostel = await Hostel.findById(req.params.id);
    if (hostel == null) {
      return res.status(404).json({ message: 'Hostel not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.hostel = hostel;
  next();
}

module.exports = router;
