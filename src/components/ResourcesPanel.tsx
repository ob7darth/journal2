import React from 'react';
import { ExternalLink, Heart, Users, Play, GraduationCap, ShoppingCart } from 'lucide-react';
import PrayerRequestsList from './PrayerRequestsList';
import BibleDataStatus from './BibleDataStatus';

const ResourcesPanel: React.FC = () => {
  const resources = [
    {
      title: 'New Hope West',
      description: 'Our church community where faith comes alive',
      url: 'https://www.newhopewest.com',
      icon: Heart,
      color: 'bg-blue-500',
      features: ['Sunday Services', 'Community Events', 'Prayer Requests', 'Ministries']
    },
    {
      title: 'New Hope Christian College',
      description: 'Equipping students for ministry and life',
      url: 'https://www.newhope.edu',
      icon: GraduationCap,
      color: 'bg-green-500',
      features: ['Degree Programs', 'Online Courses', 'Campus Life', 'Admissions']
    },
    {
      title: 'Life Resources',
      description: 'Christian books, journals, and study materials',
      url: 'https://www.liferesources.cc',
      icon: ShoppingCart,
      color: 'bg-purple-500',
      features: ['Physical SOAP Journal', 'Study Guides', 'Christian Books', 'Gift Items']
    },
    {
      title: 'NHI Plus',
      description: 'Inspiring Legacy Sermons and Classes',
      url: 'https://www.nhiplus.org',
      icon: Play,
      color: 'bg-red-500',
      features: ['Classic Sermons by Wayne Cordeiro', 'Leadership Classes', 'Sermon Podcasts']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Bible Data Status */}
      <BibleDataStatus />

      {/* Main Resources */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
        {resources.map((resource, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className={`${resource.color} p-4`}>
              <div className="flex items-center gap-3 text-white">
                <resource.icon size={24} />
                <h3 className="font-semibold text-lg">{resource.title}</h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">{resource.description}</p>
              
              <ul className="space-y-2 mb-6">
                {resource.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${resource.title} website`}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Visit Website
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Community Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Users size={24} />
          <h3 className="text-xl font-semibold">Connect with Our Community</h3>
        </div>
        
        <p className="mb-6 opacity-90">
          Join fellow believers in prayer, share your spiritual journey, and grow together in faith. 
          Our community is here to support and encourage you through prayer and fellowship.
        </p>
        
        <div className="flex flex-wrap gap-3">
          <a
            href="https://www.newhopewest.com/connect"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
          >
            <Heart size={16} />
            Connect with Us
          </a>
          <a
            href="https://newhopewest.com/lifegroups/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-400 transition-colors inline-flex items-center gap-2"
          >
            <Users size={16} />
            Small Groups
          </a>
        </div>
      </div>

      {/* Community Prayer Requests */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="text-red-600" size={24} />
          Community Prayer Requests
        </h3>
        <PrayerRequestsList limit={5} showHeader={false} />
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Technical Support</h4>
            <p className="text-sm text-gray-600">
              Having trouble with the app? Contact our support team for assistance.
            </p>
            <a href="mailto:amyhisaoka@enewhope.org" className="text-primary-600 hover:text-primary-700 text-sm">
              amyhisaoka@enewhope.org
            </a>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Spiritual Guidance</h4>
            <p className="text-sm text-gray-600">
              Questions about your faith journey? Our pastoral team is here to help.
            </p>
            <a href="mailto:lesliekirakos@enewhope.org" className="text-primary-600 hover:text-primary-700 text-sm">
              lesliekirakos@enewhope.org
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPanel;