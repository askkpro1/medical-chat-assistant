# MediChat India 🏥

An intelligent AI-powered medical assistant designed specifically for India, providing instant health guidance and medical information with local emergency contacts and healthcare context.

## ✨ Features

### 🤖 AI-Powered Medical Assistance
- **Intelligent Responses**: Get comprehensive health guidance powered by OpenAI GPT-4
- **Symptom Assessment**: Automatic severity assessment (Low, Medium, High priority)
- **Context-Aware**: Maintains conversation context for better recommendations
- **India-Specific**: Tailored for Indian healthcare system and emergency services

### 💬 Advanced Chat Interface
- **Voice Input**: Speak your symptoms using voice recognition
- **Chat History**: Save and manage multiple chat sessions
- **Message Management**: Delete individual messages or clear entire chats
- **Export Functionality**: Download chat history as JSON files
- **Real-time Typing Indicators**: See when the AI is processing your request

### 🎨 User Experience
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility**: Screen reader friendly with proper ARIA labels
- **Feedback System**: Rate AI responses with thumbs up/down

### 🔒 Privacy & Safety
- **Local Storage**: Chat history stored locally on your device
- **No Personal Data**: No personal information required to use
- **Medical Disclaimers**: Clear warnings about professional medical advice
- **Emergency Contacts**: Quick access to India's emergency numbers (108, 112)

### 📊 Analytics Dashboard
- **Admin Panel**: Comprehensive analytics for healthcare providers
- **Usage Statistics**: Track conversations, response times, and user satisfaction
- **Data Export**: Export analytics data for further analysis
- **Severity Tracking**: Monitor symptom severity distribution

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd medichat-india
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
\`\`\`env
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
\`\`\`

4. **Set up the database**
Run the SQL scripts in the `scripts/` folder in your Supabase SQL editor:
- `01-setup-database.sql` - Creates tables and indexes
- `02-seed-sample-data.sql` - Adds sample medical knowledge
- `03-enhanced-schema.sql` - Adds analytics features

5. **Start the development server**
\`\`\`bash
npm run dev
\`\`\`

6. **Open your browser**
Navigate to `http://localhost:3000`

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Recharts** - Data visualization for analytics

### Backend & AI
- **OpenAI GPT-4** - AI-powered medical responses
- **AI SDK** - Streamlined AI integration
- **Supabase** - PostgreSQL database and real-time features
- **Next.js API Routes** - Serverless backend functions

### Additional Features
- **Web Speech API** - Voice input functionality
- **Local Storage** - Client-side data persistence
- **PWA Ready** - Progressive Web App capabilities

## 📱 Usage

### For Patients
1. **Ask Questions**: Type or speak your health concerns
2. **Get Guidance**: Receive AI-powered medical information
3. **Emergency Help**: Access India's emergency numbers instantly
4. **Save History**: Keep track of your health conversations
5. **Export Data**: Download your chat history for records

### For Healthcare Providers
1. **Admin Dashboard**: Access analytics at `/admin`
2. **Monitor Usage**: Track patient interactions and satisfaction
3. **Export Data**: Download usage statistics and trends
4. **Severity Analysis**: Monitor symptom severity patterns

## 🔧 Configuration

### OpenAI Settings
- **Model**: GPT-4o-mini (cost-effective)
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 500 (concise responses)
- **System Prompt**: India-specific medical guidance

### Database Schema
- **chat_logs**: Store all conversations with metadata
- **symptom_knowledge**: Curated medical knowledge base
- **user_sessions**: Track user engagement
- **daily_analytics**: Aggregated usage statistics

## 🚨 Important Disclaimers

⚠️ **Medical Disclaimer**: This application provides general health information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.

🆘 **Emergency Contacts**: 
- Medical Emergency: **108**
- National Emergency: **112**

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

## 🔄 Updates

### Latest Version Features
- ✅ Voice input with speech recognition
- ✅ Advanced chat session management
- ✅ Real-time typing indicators
- ✅ Message feedback system
- ✅ Comprehensive admin analytics
- ✅ Mobile-responsive design
- ✅ Dark/light theme support

---

**Built with ❤️ for India's healthcare needs**
