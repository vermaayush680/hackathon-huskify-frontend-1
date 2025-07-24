import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users, Cog, Monitor, Database, Globe } from "lucide-react";
import { apiService } from "@/services/api";
import { setPlatformInStorage, clearPlatformData } from "@/utils/platform";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface Platform {
  id: number;
  name: string;
  tag: string;
  description?: string;
  color?: string;
  icon?: string;
}

const Homepage = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      setIsLoading(true);
      const platformsData = await apiService.getAllPlatforms();
      console.log('Platforms data:', platformsData);
      
      if (Array.isArray(platformsData)) {
        setPlatforms(platformsData);
      } else {
        // Fallback to mock platforms if API fails
        setPlatforms(getMockPlatforms());
      }
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
      // Use fallback mock data
      setPlatforms(getMockPlatforms());
      toast({
        title: "Notice",
        description: "Using demo platforms. API connection failed.",
        variant: "default",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMockPlatforms = (): Platform[] => [
    {
      id: 1,
      name: "Engineering",
      tag: "ENG",
      description: "Software development, DevOps, and technical infrastructure teams",
      color: "bg-blue-500",
      icon: "monitor"
    },
    {
      id: 2,
      name: "Product",
      tag: "PROD",
      description: "Product management, design, and user experience teams",
      color: "bg-purple-500",
      icon: "users"
    },
    {
      id: 3,
      name: "Operations",
      tag: "OPS",
      description: "Business operations, finance, and administrative teams",
      color: "bg-green-500",
      icon: "cog"
    },
    {
      id: 4,
      name: "Data & Analytics",
      tag: "DATA",
      description: "Data science, analytics, and business intelligence teams",
      color: "bg-yellow-500",
      icon: "database"
    },
    {
      id: 5,
      name: "Marketing",
      tag: "MKTG",
      description: "Marketing, communications, and growth teams",
      color: "bg-pink-500",
      icon: "globe"
    },
    {
      id: 6,
      name: "Corporate",
      tag: "CORP",
      description: "HR, legal, and corporate functions",
      color: "bg-gray-500",
      icon: "building"
    }
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'monitor':
        return <Monitor className="h-8 w-8" />;
      case 'users':
        return <Users className="h-8 w-8" />;
      case 'cog':
        return <Cog className="h-8 w-8" />;
      case 'database':
        return <Database className="h-8 w-8" />;
      case 'globe':
        return <Globe className="h-8 w-8" />;
      case 'building':
        return <Building className="h-8 w-8" />;
      default:
        return <Building className="h-8 w-8" />;
    }
  };

  const handlePlatformSelect = (platform: Platform) => {
    // Clear any old platform data before setting new platform
    clearPlatformData();
    
    // Store the platform name in localStorage
    setPlatformInStorage(platform.name);
    
    // Store platform ID for API calls
    localStorage.setItem('selectedPlatformId', platform.id.toString());
    localStorage.setItem('selectedPlatformName', platform.name);
    localStorage.setItem('selectedPlatformTag', platform.tag);

    toast({
      title: "Platform Selected",
      description: `You've selected ${platform.name}. ${user ? 'Redirecting to dashboard...' : 'Redirecting to login...'}`,
    });

    // Navigate based on authentication status
    setTimeout(() => {
      if (user) {
        // User is authenticated, go directly to dashboard
        // Use replace: true to prevent going back to old platform state
        navigate(`/${platform.tag}`, { replace: true });
      } else {
        // User not authenticated, go to login
        navigate(`/${platform.tag}/login`, { replace: true });
      }
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="text-center">
                  <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Huskify
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {user 
              ? "Select your platform to access the husky demand portal and manage your workforce requests"
              : "Select your platform to access the husky demand portal. You'll be asked to login after selecting a platform."
            }
          </p>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {platforms.map((platform) => (
            <Card 
              key={platform.id} 
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              onClick={() => handlePlatformSelect(platform)}
            >
              <CardHeader className="text-center">
                <div className={`w-16 h-16 rounded-full ${platform.color || 'bg-blue-500'} flex items-center justify-center mx-auto mb-4 text-white group-hover:scale-110 transition-transform`}>
                  {getIcon(platform.icon || 'building')}
                </div>
                <CardTitle className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                  {platform.name}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {platform.description || `Access platform resources`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full group-hover:bg-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlatformSelect(platform);
                  }}
                >
                  {user ? `Enter` : `Select`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p className="text-sm">
            Need help? Contact your system administrator or IT support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
