import React, { useContext } from 'react';
import { Layout, Menu } from 'antd';
import { useLocation } from 'react-router-dom';
const { Sider } = Layout;
import {
    UserOutlined,
    HomeOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import AuthContext from '../context/AuthContext';

const SideBar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  return (
    <Sider
      width={256}
      style={{ backgroundColor: '#001529', minHeight: '100vh', position: 'fixed' }}
    >
      <div style={{ padding: '16px', color: 'white' }}>
        <p>{user && user.name}</p>
        <p>{user && user.post}</p>
      </div>
      <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}>
        <Menu.Item key="/dashboard" icon={<HomeOutlined />}>
          <a href="/dashboard">Dashboard</a>
        </Menu.Item>
        <Menu.Item key="/hostels" icon={<HomeOutlined />}>
          <a href="/hostels">Hostels</a>
        </Menu.Item>
        <Menu.Item key="/rooms" icon={<HomeOutlined />}>
          <a href="/rooms">Rooms</a>
        </Menu.Item>
        <Menu.Item key="/resident" icon={<UserOutlined />}>
          <a href="/resident">Residents</a>
        </Menu.Item>
        <Menu.Item key="/payment" icon={<DollarOutlined />}>
          <a href="/payment">Payments</a>
        </Menu.Item>
        <Menu.Item key="/monthly-summary" icon={<DollarOutlined />}>
          <a href="/monthly-summary">Monthly Summary</a>
        </Menu.Item>
        <Menu.Item key="/monthly-expenses" icon={<DollarOutlined />}>
          <a href="/monthly-expenses">Monthly Expenses</a>
        </Menu.Item>
        <Menu.Item key="/resident-registration" icon={<DollarOutlined />}>
          <a href="/resident-registration">Registration Form</a>
        </Menu.Item>
      </Menu>
      <div style={{ padding: '16px' }}>
        <button onClick={logout} style={{ background: 'red', color: 'white', padding: '8px', border: 'none', width: '100%', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
    </Sider>
  );
};

export default SideBar;
