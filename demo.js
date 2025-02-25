return (
  <div className="min-h-screen flex flex-col bg-white">
    <ToastContainer position="top-center" autoClose={3000} />
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  strokeLinecap="round"
                />
                <path
                  d="M8 12H16M16 12L12 8M16 12L12 16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-900 tracking-wide">
              Portal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {userName ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-800">
                  <FiUser className="text-gray-600" />
                  <span className="font-medium text-gray-900">{userName}</span>
                </div>

                {/* Forum Link - always visible */}
                <Link
                  href="https://portal-discussion-forum.onrender.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-all shadow-sm"
                >
                  <FiMessageSquare />
                  <span>Forum</span>
                </Link>

                {/* Button to open AI Assistant */}
                <button
                  onClick={() => setShowChat(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all"
                >
                  Chat with AI
                </button>

                <button
                  onClick={() => router.push("/profile")}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Admin
                </Link>
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-all"
                >
                  Login
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Navigation Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-800 transition-all"
          >
            {isMobileMenuOpen ? (
              <FiX className="w-5 h-5" />
            ) : (
              <FiMenu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-white border-b border-gray-200 shadow-md transition-all">
          <div className="px-4 py-5 space-y-4">
            {userName ? (
              <>
                <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
                  <FiUser className="text-gray-600" />
                  <span className="font-medium text-gray-900">{userName}</span>
                </div>

                {/* Forum Link in Mobile Menu */}
                <Link
                  href="https://portal-discussion-forum.onrender.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <FiMessageSquare />
                    <span>Forum</span>
                  </div>
                </Link>

                {/* Button to open AI Assistant */}
                <button
                  onClick={() => setShowChat(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all"
                >
                  Chat with AI
                </button>

                <button
                  onClick={() => {
                    router.push("/profile");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 rounded-lg hover:bg-red-100 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/admin"
                  className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
                <Link
                  href="/login"
                  className="block px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>

    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userName ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardCards.map((item, index) => {
              // Executive-only disabled cards
              if (item.requiresExecutive && userRole !== "Executive") {
                return (
                  <div
                    key={index}
                    className="group relative bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 opacity-50 cursor-not-allowed p-6 transition-all"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white text-gray-400 rounded-xl flex items-center justify-center shadow-md">
                        {item.icon}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-400">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.8)_4px,rgba(255,255,255,0.8)_6px)] rounded-xl z-10" />
                  </div>
                );
              }

              // Calendar card special treatment
              if (item.path === "/calendar") {
                return (
                  <div
                    key={index}
                    className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-400 shadow-sm hover:shadow-lg transition-all p-6"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-md">
                        {item.icon}
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs border-2 border-white">
                          <FiCalendar className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setLoadingCard(item.path);
                        handleCalendarClick();
                        setTimeout(() => setLoadingCard(null), 500);
                      }}
                      className="absolute inset-0 w-full rounded-xl z-10"
                    />
                    {loadingCard === item.path && (
                      <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl backdrop-blur-sm">
                        <FiLoader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                );
              }

              // Regular cards
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-400 shadow-sm hover:shadow-lg transition-all p-6"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      {item.icon}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 rounded-xl z-10"
                    />
                  ) : (
                    <button
                      onClick={() => handleNavigation(item.path, item.api)}
                      className="absolute inset-0 w-full rounded-xl z-10"
                    />
                  )}
                  {loadingCard === item.path && (
                    <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl backdrop-blur-sm">
                      <FiLoader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-md mx-auto py-16 text-center">
            <div className="space-y-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-blue-50 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <FiAlertTriangle className="w-10 h-10 text-blue-600" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Employee Portal Access
                </h2>
                <p className="text-gray-600 text-sm sm:text-base max-w-xs mx-auto">
                  Authenticate to access your management dashboard
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-xl shadow hover:shadow-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Get Started
                <FiArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>

    {/* Popup Modal for Calendar Selection */}
    {showCalendarPopup && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        onClick={() => setShowCalendarPopup(false)}
      >
        <div
          className="bg-white rounded-xl shadow-lg w-full max-w-md transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Choose Calendar
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Select where you would like to schedule your plans
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handlePortalCalendar}
                className="flex items-center justify-center space-x-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all duration-200"
              >
                <FiCalendar className="w-5 h-5" />
                <span className="font-medium">Portal Calendar</span>
              </button>

              <button
                onClick={handleGoogleCalendar}
                className="flex items-center justify-center space-x-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200"
              >
                <FaGoogle className="w-5 h-5" />
                <span className="font-medium">Calendar</span>
              </button>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setShowCalendarPopup(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* AI Chat Popup */}
    {showChat && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Backdrop with modern blur */}
        <div
          className="absolute inset-0 bg-black opacity-40 backdrop-blur-sm"
          onClick={() => setShowChat(false)}
        />

        {/* Main Chat Container */}
        <div
          className="relative w-full max-w-4xl mx-auto bg-white rounded-xl shadow-xl flex flex-col overflow-hidden transition-transform"
          style={{ maxHeight: "85vh" }}
        >
          {/* Close Button - Redesigned */}
          <button
            onClick={() => setShowChat(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200 z-10 group"
            aria-label="Close chat"
          >
            <svg
              className="w-5 h-5 transform group-hover:rotate-90 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Chat Header - Modern Design */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-8">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-white/80 flex items-center justify-center backdrop-blur-sm">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z"
                    />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  AI Assistant
                </h3>
                <p className="text-blue-100 text-[15px] mt-0.5">
                  Ready to help you with any questions
                </p>
              </div>
            </div>
          </div>

          {/* Messages Container - Enhanced */}
          <div
            ref={messageListRef}
            className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scroll-smooth"
            style={{ maxHeight: "calc(85vh - 230px)" }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "assistant" ? "justify-start" : "justify-end"
                } transition-opacity duration-300`}
              >
                {msg.role === "assistant" && (
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mr-4 mt-2">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-6 py-4 rounded-xl shadow-sm ${
                    msg.role === "assistant"
                      ? "bg-white border border-gray-200 text-gray-700"
                      : "bg-blue-600 text-white ml-auto"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Box - Modern Design */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 px-6 py-4 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[15px] placeholder-gray-400 text-gray-700 transition-all duration-200 shadow-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoadingAI}
                className={`flex items-center justify-center p-4 rounded-xl transition-all duration-200 ${
                  isLoadingAI
                    ? "bg-gray-100 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow hover:shadow-md"
                }`}
              >
                {isLoadingAI ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5 text-white transform rotate-90"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex space-x-6 justify-center">
            {/* Existing Links */}
            <a
              href="https://nishantb66.github.io/MyPortfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FiUser className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/nishantbaru"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FiLinkedin className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/nishantb66"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FiGithub className="w-5 h-5" />
            </a>

            {/* New 'Message me' Link */}
            <Link
              href="/contact"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Message me
            </Link>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Portal. Crafted by Nishant.
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>
);
