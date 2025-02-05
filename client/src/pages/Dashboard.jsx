// import React from 'react';
// import {  Layout, Menu } from 'antd';
// import {Grid} from '@mui/material';
// import {
//   UserOutlined,
//   HomeOutlined,
//   DollarOutlined,
//   SettingOutlined,
// } from '@ant-design/icons';

// import './styles/dashboard.css';
// import HostelOverview from '../components/HostelOverview';
// import SideBar from '../components/Sider';
// import RoomOverview from '../components/RoomOverview';

// const { Header, Sider, Content } = Layout;

// const Dashboard = () => {
//   return (
      
//     <div style={{minHeight:'100vh',minWidth:'100%', paddingLeft:'9rem'}}>
//       {/* <SideBar/> */}
//      <Grid item xs={12} sm={6} md={4}  >
//      <HostelOverview/>
//      <RoomOverview/>
//       </Grid>     
    
    
//     </div>
  
//   );
// };

// export default Dashboard;

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { BedDouble, Users, Home, Calendar,BadgeAlert } from 'lucide-react';

import { Skeleton } from '../components/ui/skeleton';
import api from '../../api/apiKey';


// API function
const fetchDashboardData = async () => {
  try {
    const response = await api.get('https://beiyo-admin.in/api/adminDashboard/dataMetrics');
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
};

const LoadingSkeleton = () => (
  <Card className="bg-white">
    <CardContent className="p-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const getData = async () => {
      setIsLoading(true);
      const result = await fetchDashboardData();
      if (result) {
        setData(result);
      } else {
        setIsError(true);
      }
      setIsLoading(false);
    };

    getData();
  }, []);

  const metrics = [
    { title: 'Hostels', value: data?.noOfHostels ?? 0, icon: Home, subtitle: 'Total Hostels' },
    { title: 'Rooms', value: data?.noOfRooms ?? 0, icon: Home, subtitle: 'Total Rooms' },
    { title: 'Beds', value: data?.noOfBeds ?? 0, icon: BedDouble, subtitle: 'Total Beds' },
    { title: 'Current Tenants', value: data?.noOfResidents ?? 0, icon: Users, subtitle: 'Active Tenants' },
    { title: 'Bookings', value: data?.noOfBookings ?? 0, icon: Calendar, subtitle: 'Total Bookings' },
    { title: 'Tickets', value: data?.openTickets ?? 0, icon:BadgeAlert, subtitle: 'Open Tickets' }
  ];

  if (isError) {
    return (
      <div className="p-6 text-center text-red-600">
        Error loading dashboard data. Please try again later.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {isLoading
          ? Array(4).fill(0).map((_, index) => <LoadingSkeleton key={index} />)
          : metrics.map((metric, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-shadow w-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                      <h3 className="text-2xl font-bold mt-2 text-gray-900">{metric.value}</h3>
                      <p className="text-sm text-gray-500 mt-1">{metric.subtitle}</p>
                    </div>
                    <metric.icon className="h-6 w-6 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
};

export default Dashboard;
