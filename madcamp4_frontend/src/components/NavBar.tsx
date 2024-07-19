import React from 'react';
import { Link } from 'react-router-dom';

const NavBar: React.FC = () => {
  return (
    <nav className="bg-blue-500 p-4 text-white">
      <ul className="flex space-x-4">
        <li>
          <Link to="/" className="hover:underline">Home</Link>
        </li>
        <li>
          <Link to="/page1" className="hover:underline">Page 1</Link>
        </li>
        <li>
          <Link to="/page2" className="hover:underline">Page 2</Link>
        </li>
        <li>
          <Link to="/page3" className="hover:underline">Page 3</Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;
