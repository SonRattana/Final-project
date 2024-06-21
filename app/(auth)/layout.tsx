const AuthLayout = ({ children }:{children: React.ReactNode}) => {
    return ( 
        <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#2c3e50' }}>
            {children}
        </div>
     );
}
 
export default AuthLayout;