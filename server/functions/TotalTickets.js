const Hostel = require('../models/Hostel')
const Ticket = require('../models/ticket')
const totalTickets = async (hostelId) => {
  try {
      // Count the number of tickets directly
      const totalTickets = await Ticket.countDocuments({ hostelId: hostelId });

      // Update the totalTickets field in the Hostel document
      await Hostel.findByIdAndUpdate(
          hostelId,
          { totalTickets: totalTickets },
          { new: true } // Returns the updated document
      );

      return totalTickets;
  } catch (error) {
      console.error('Error updating total tickets:', error);
      throw error; // Rethrow the error or handle it as needed
  }
};


const totalPendingTickets = async (hostelId)=>{
    try {
        // Count the number of tickets directly
        const totalTickets = await Ticket.countDocuments({ hostelId: hostelId },{status:'Open'});
        // Update the totalTickets field in the Hostel document
        await Hostel.findByIdAndUpdate(
            hostelId,
            { totalPendingTickets: totalTickets },
            { new: true } // Returns the updated document
        );
  
        return totalTickets;
    } catch (error) {
        console.error('Error updating total tickets:', error);
        throw error; // Rethrow the error or handle it as needed
    }
}
const totalClosedTickets = async (hostelId)=>{
    try {
        // Count the number of tickets directly
        const totalTickets = await Ticket.countDocuments({ hostelId: hostelId },{status:'Closed'});
        // Update the totalTickets field in the Hostel document
        await Hostel.findByIdAndUpdate(
            hostelId,
            { totalClosedTickets: totalTickets },
            { new: true } // Returns the updated document
        );
  
        return totalTickets;
    } catch (error) {
        console.error('Error updating total tickets:', error);
        throw error; // Rethrow the error or handle it as needed
    }
}



module.exports = {totalTickets,totalPendingTickets,totalClosedTickets};