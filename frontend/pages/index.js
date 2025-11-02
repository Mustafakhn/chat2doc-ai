import Link from 'next/link'
import { FileText, MessageSquare, Upload, ArrowRight, CheckCircle, BookOpen, FileSearch, Brain, Zap, Shield, Users, Star, TrendingUp, Clock, Globe, Lock, Sparkles, Scale, Heart, GraduationCap, DollarSign, PenTool, FolderOpen, BarChart3, Lightbulb, Target } from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: Upload,
      title: 'Upload Documents',
      description: 'Upload PDF, DOCX, and text documents to create your personal knowledge base.'
    },
    {
      icon: MessageSquare,
      title: 'AI-Powered Chat',
      description: 'Ask questions about your documents and get intelligent, contextual answers.'
    },
    {
      icon: FileText,
      title: 'Persistent History',
      description: 'Your conversations are saved and you can continue them anytime.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your documents are encrypted and stored securely. Full control over sharing.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get instant responses with our optimized AI models and smart caching.'
    },
    {
      icon: Users,
      title: 'Share & Collaborate',
      description: 'Share documents with others and collaborate on research and analysis.'
    }
  ]

  const examples = [
    {
      category: "Research Papers",
      icon: BookOpen,
      color: "blue",
      examples: [
        "Summarize the main arguments",
        "What are the key findings?",
        "Extract all citations mentioned"
      ]
    },
    {
      category: "Business Documents",
      icon: FileSearch,
      color: "green",
      examples: [
        "Extract action items from meeting minutes",
        "What are the revenue projections?",
        "List all stakeholders mentioned"
      ]
    },
    {
      category: "Technical Docs",
      icon: Brain,
      color: "purple",
      examples: [
        "Explain this code in simple terms",
        "What are the API endpoints?",
        "List configuration parameters"
      ]
    }
  ]

  const useCases = [
    {
      title: "Research & Analysis",
      description: "Analyze papers and extract insights from your documents",
      icon: BookOpen,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Business Intelligence",
      description: "Process contracts and reports for actionable insights",
      icon: BarChart3,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Technical Support",
      description: "Get help with documentation and implementation guides",
      icon: Brain,
      color: "from-purple-500 to-violet-500"
    },
    {
      title: "Legal & Compliance",
      description: "Review contracts, policies, and legal documents efficiently",
      icon: Scale,
      color: "from-red-500 to-pink-500"
    },
    {
      title: "Healthcare & Medical",
      description: "Analyze medical literature, case studies, and research papers",
      icon: Heart,
      color: "from-emerald-500 to-teal-500"
    },
    {
      title: "Education & Learning",
      description: "Create study materials and analyze educational content",
      icon: GraduationCap,
      color: "from-indigo-500 to-blue-500"
    },
    {
      title: "Financial Services",
      description: "Process financial reports, budgets, and investment documents",
      icon: DollarSign,
      color: "from-yellow-500 to-orange-500"
    },
    {
      title: "Creative Writing",
      description: "Analyze manuscripts, scripts, and creative content",
      icon: PenTool,
      color: "from-pink-500 to-rose-500"
    }
  ]

  const stats = [
    { number: "10M+", label: "Documents Processed", icon: FileText },
    { number: "99.9%", label: "Uptime", icon: Zap },
    { number: "50+", label: "Languages Supported", icon: Globe },
    { number: "24/7", label: "AI Assistant", icon: Clock }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Turn your documents into
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> intelligent conversations</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
            Upload any document and chat with it using advanced AI. Get instant answers,
            extract insights, and maintain conversation history across all your files.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register">
              <button className="group relative px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300">
                <span className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            <Link href="/login">
              <button className="px-10 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-300">
                Sign In
              </button>
            </Link>
          </div>

          {/* Demo Preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-500 ml-4">Chat2Doc Demo - Research Paper Analysis</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                    What's the main argument in this paper?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg max-w-2xl">
                    The main argument is that traditional machine learning approaches have limitations in handling high-dimensional data. The authors propose a novel neural architecture that uses attention mechanisms to focus on relevant features, achieving 23% better accuracy on benchmark datasets.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                    What are the key findings?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg max-w-2xl">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">Performance improvement of 23% on CIFAR-10 dataset</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">Reduced training time by 40% compared to baseline models</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">Better generalization on unseen data with 15% improvement</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                    How does it compare to existing methods?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg max-w-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">AI is analyzing the comparison section...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Powerful Features for
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Modern Document Intelligence</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to transform your documents into an intelligent knowledge base
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Examples Section */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {/* <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              Interactive Examples
            </div> */}
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See What You Can Do
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> with Your Documents</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real examples of how AI can help you extract insights, answer questions, and analyze your documents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {examples.map((category, index) => {
              const colorClasses = {
                blue: {
                  icon: "bg-gradient-to-br from-blue-400 to-blue-600",
                  dot: "bg-gradient-to-r from-blue-400 to-blue-600"
                },
                green: {
                  icon: "bg-gradient-to-br from-green-400 to-green-600",
                  dot: "bg-gradient-to-r from-green-400 to-green-600"
                },
                purple: {
                  icon: "bg-gradient-to-br from-purple-400 to-purple-600",
                  dot: "bg-gradient-to-r from-purple-400 to-purple-600"
                }
              };

              return (
                <div key={index} className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${colorClasses[category.color].icon} rounded-xl flex items-center justify-center mr-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors">{category.category}</h3>
                  </div>
                  <div className="space-y-2">
                    {category.examples.map((example, exampleIndex) => (
                      <div key={exampleIndex} className="flex items-start group/item hover:text-gray-900 transition-colors cursor-pointer">
                        <div className={`w-1.5 h-1.5 ${colorClasses[category.color].dot} rounded-full mt-2 mr-3 flex-shrink-0 group-hover/item:scale-125 transition-transform`}></div>
                        <p className="text-gray-600 text-sm leading-relaxed group-hover/item:font-medium transition-all">
                          "{example}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {/* <div className="mt-20 text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-8">
          Trusted by Thousands
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div> */}

      {/* Use Cases Grid */}
      <div className="mt-20 pb-24">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            A universal solution for document intelligence
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you're building, designing, or discovering — Chat2Doc helps every industry work smarter with AI-powered document
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {useCases.map((useCase, index) => (
            <div key={index} className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 text-center">
              <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${useCase.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                <useCase.icon className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">
                {useCase.title}
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to transform your documents?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of users who are already using AI to unlock insights from their documents
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <button className="group relative px-10 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30">
                  <span className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>
              <Link href="/login">
                <button className="px-10 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/30">
                  Sign In
                </button>
              </Link>
            </div>
            <p className="text-blue-200 text-sm mt-6">
              No credit card required • Free forever plan available
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
