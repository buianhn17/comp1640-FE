const AdminFooter = () => {
    return (
      <footer className="bg-gray-50 border-t mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4 text-sm text-gray-500 flex justify-between">
          <span>
            © {new Date().getFullYear()} Enterprise Idea Management System
          </span>
  
          <span>
            Admin Control Panel
          </span>
        </div>
      </footer>
    );
  };
  
  export default AdminFooter;