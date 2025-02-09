import { useEffect, useState } from "react";
import axios from "axios";

const useFetchHostels = () => {
  const [hostels, setHostels] = useState([]);

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const response = await axios.get("https://beiyo-admin.in/api/hostels");
        setHostels(response.data);
      } catch (error) {
        console.error("Error fetching hostels:", error);
      }
    };

    fetchHostels();
  }, []);

  return hostels;
};

export default useFetchHostels;
