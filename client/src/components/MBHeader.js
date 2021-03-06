import React, { Component } from 'react';
import AccountNav from './AccountNav';
import Avatar from './Avatar';
import { NavLink, Link } from 'react-router-dom';
import NotificationIcon from './NotificationIcon';
import { getData } from '../util/serverFetch';
import { connect } from 'react-redux';
import guestAva from '../assets/guestavatar.png';
import './Header.css';


class MBHeader extends Component{

    constructor(props){
        super(props);

        this.state = {
            showAccount: false,
            showMenu: false,
            avatar: '',
            notification: false
        };

        this.showAccount = this.showAccount.bind(this);
        this.showMenu = this.showMenu.bind(this);
        this.closeNav = this.closeNav.bind(this);
        this.removeAnimation = this.removeAnimation.bind(this);
        this.closeAllNavs = this.closeAllNavs.bind(this);
        this.scrollToTop = this.scrollToTop.bind(this);
        this.loadAvatar = this.loadAvatar.bind(this);
        this.handleNotification = this.handleNotification.bind(this);
        this.resetNotification = this.resetNotification.bind(this);
    }


    
    
    // Load Avatar or supply guest avatar
    componentDidMount(){

        window.addEventListener('click', this.closeNav);

        if(this.props.isAuth){
            this.loadAvatar();
            
        }
        else{
            this.setState({
                avatar: guestAva
            });
        }    
    }


    // When user logs in update the avatar image
    componentDidUpdate(prevProps){
        if(prevProps.isAuth !== this.props.isAuth){
            if(this.props.isAuth){
                this.loadAvatar();
            }
            else{
                this.setState({
                    avatar: guestAva
                });
            }
        }
    }

    componentWillUnmount(){
        window.removeEventListener('click', this.closeNav);
    }

    // Show light for new notifications
    handleNotification(){
        this.setState({
            notification: true
        });
    }

    // Remove Notification light in account navigation (next to 'Notifications')
    resetNotification(){
        this.setState({
            notification: false
        });
    }

    
    // close navs on click
    closeAllNavs(evt){
        evt.stopPropagation();
        this.removeAnimation();
        document.querySelector('.overlay').classList.remove('overlay--show');
        this.setState({
            showAccount: false,
            showMenu: false
        });
    }


    loadAvatar(){
        const serverResponse = getData('/auth');
    
            serverResponse
            .then( response => response.json())
            .then((data) => {
                
                if(data.user){
                    this.setState({
                        avatar: data.user.avatar
                    });
                }         
            });
    }

    // Show account navigation
    showAccount(evt){
        evt.stopPropagation();

        const { showAccount } = this.state;
        const overlay = document.querySelector('.overlay');

        // this.notificationLight();
        this.removeAnimation();

        if(showAccount){
            this.setState({
                showAccount: false,
                showMenu: false
            }, () => {
                overlay.classList.remove('overlay--show');
            });
        }
        else{
            this.setState({
                showAccount: true,
                showMenu: false
            }, ()=> {
                overlay.classList.add('overlay--show');
            });
        }
    }


    // Global site navigation
    showMenu(evt){
        evt.stopPropagation();

        const { showMenu } = this.state;
        const hold = document.querySelector('.hold');
        const bars = Array.from(document.getElementsByClassName('bar'));
        const overlay = document.querySelector('.overlay');

        hold.classList.toggle('active');
        
        bars.forEach((bar) => {
            bar.classList.remove('no-animation');
        });
        

        if(showMenu){
            this.setState({
                showAccount: false,
                showMenu: false
            }, () => {
                overlay.classList.remove('overlay--show');
            });
        }
        else{
            this.setState({
                showAccount: false,
                showMenu: true
            }, () => {
                overlay.classList.add('overlay--show');
            });
        }
    }

    // Animation for hamburger menu (global site navigation)
    removeAnimation(){
        const hold = document.querySelector('.hold');
        hold.classList.remove('active');
    }

    // Close nav if not clicking on any nav items 
    closeNav(evt){
       if(!evt.target.classList.contains('nav-item__link') || !evt.target.classList.contains('avatar') || !evt.target.classList.contains('header-account-content') || !evt.target.classList.contains('bar')){
           this.removeAnimation();
            this.setState({
                showAccount: false,
                showMenu: false
            });
       }
    }


    scrollToTop(evt){
       evt.stopPropagation();
    
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }


    render(){
        
        const { showMenu, showAccount, avatar, notification } = this.state;
        
        return(
            <header onClick={this.scrollToTop} className='container header-container--flex'>
                <div className='overlay' onClick={this.closeAllNavs}></div>
                <Link to='/' onClick={this.closeAllNavs}><h1 className='logo'>LookID.</h1></Link>
                <div className='header-nav-container'>
                    <div onClick={this.showAccount} className='header-account-container'>
                        <div className='header-notification-container'>
                            <Avatar addClass='avatar-container--xs' avatar={avatar} />
                            <NotificationIcon handleNotification={this.handleNotification}/>
                        </div>
                        {showAccount && 
                            <AccountNav mobileNotification={notification} resetNotification={this.resetNotification}/>
                        }
                    </div>
                        
                    <div className='header-global-nav-container'>
                        <div className='hold' onClick={this.showMenu}>
                            <div className='bar  bar-top  no-animation'></div>
                            <div className='bar  bar-mid  no-animation'></div>
                            <div className='bar  bar-low  no-animation'></div>
                        </div>

                        {showMenu && 
                            <nav className='global-nav'>
                                <ul className='site-nav-list'>
                                    <li className='site-nav-list__item'><NavLink to='/' onClick={this.closeAllNavs} className='nav-item__link'>Home</NavLink></li>
                                    <li className='site-nav-list__item'><NavLink to='/feed' onClick={this.closeAllNavs} className='nav-item__link'>Feed</NavLink></li>
                                    <li className='site-nav-list__item'><NavLink to='/boards' className='nav-item__link' onClick={this.closeAllNavs}>Boards</NavLink></li>
                                </ul>
                            </nav>
                        }
                    </div>
                </div>
            </header>
        )
    }
}


function mapStateToProps(state){
    return{
        isAuth: state.isAuth
    }
}

export default connect(mapStateToProps)(MBHeader);