import React from 'react'
import './Footer.css';

const Footer = () => {
  return (
    <footer  className='footer'>
      <div className='footer-made-by'>
        Made by Students for all the Students
      </div>
      <div className='footer-copyright'>
        &copy; {new Date().getFullYear()} All rights reserved.
      </div>
      {/* <div className='footer-made-with'>
        Made with <span className='footer-heart'>♥</span> by <b>Group - 15</b>
      </div> */}
      <div className='footer-contact'>
        Department: <a href="mailto:Ayushpatil2005@gmail.com" className='footer-contact-link'>Computer Engineering</a>
      </div>
      <div className='footer-github-link'>
        VIT:&nbsp;
        <a
          href="https://www.vit.edu"
          target="_blank"
          rel="noopener noreferrer"
          className='footer-github-link'
        >
          Vishwakarma Institute of Technology
        </a>
      </div>
    </footer>
  );
};


export default Footer