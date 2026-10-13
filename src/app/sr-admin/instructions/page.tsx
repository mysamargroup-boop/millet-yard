
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Image as ImageIcon, FileText, UploadCloud, Edit, List, Search, AlertCircle, Cloud, BarChart, ShoppingBag, Users, Megaphone, Send, Palette, Settings as SettingsIcon, Newspaper, Tag, FileSpreadsheet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const instructions = {
  products: {
    title: "Product Management",
    icon: <ShoppingBag />,
    steps: [
      {
        icon: <List className="h-5 w-5 text-primary" />,
        title: "Go to Products",
        description: "Navigate to 'Products' from the sidebar. Use search to find items."
      },
      {
        icon: <UploadCloud className="h-5 w-5 text-blue-500" />,
        title: "Add or Edit",
        description: "Click 'Add Product' or 'Edit'. Use the 'Generate AI Description' button to automatically create engaging product text."
      },
      {
        icon: <Edit className="h-5 w-5 text-orange-500" />,
        title: "Fill Details",
        description: "Enter price, images, and other details. The Product ID is auto-generated but can be customized."
      },
      {
        icon: <FileSpreadsheet className="h-5 w-5 text-green-600" />,
        title: "Import / Export",
        description: "Use 'Export' to download your inventory. Use 'Import' to bulk-upload products via Excel/CSV. Ensure columns match: Name, Category, RegularPrice, etc."
      },
      {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        title: "Save & Verify",
        description: "Click 'Create' or 'Update'. Changes are instant. Verification is easy via the 'View Product' link."
      }
    ]
  },
  coupons: {
    title: "Coupons & Discounts",
    icon: <Tag />,
    steps: [
      {
        icon: <List className="h-5 w-5 text-primary" />,
        title: "Manage Coupons",
        description: "Go to 'Coupons' to create discount codes. Choose between percentage or flat amount off."
      },
      {
        icon: <Megaphone className="h-5 w-5 text-blue-500" />,
        title: "Banners",
        description: "Use the 'Banners' section to manage site-wide alerts and promotional banners."
      }
    ]
  },
  images: {
    title: "Site Images",
    icon: <ImageIcon />,
    notes: [
      {
        icon: <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />,
        title: "Understanding Image IDs",
        description: "Images are mapped by their ID (e.g., 'hero-desktop'). You can see the usage description for each image card."
      },
      {
        icon: <Edit className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />,
        title: "Changing Image ID",
        description: "To replace an existing image slot or create a new one, type a new ID in the 'New ID (optional)' field and save. This is useful for reordering sliders."
      },
      {
        icon: <Cloud className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />,
        title: "Upload Options",
        description: "Paste a public image URL or use the 'Upload' button (if Cloudinary is configured). Use proper aspect ratios for best results."
      }
    ]
  },
  seo: {
    title: "SEO & Scoring",
    icon: <Search />,
    description: "You don't have to worry about complex SEO settings. The system automatically optimizes your site for search engines. When adding or editing a product or blog, you'll see real-time SEO scores next to key fields. These scores give you instant feedback and suggestions to help you rank higher on Google.",
    notes: [
      {
        icon: <AlertCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />,
        title: "How It Works",
        description: "The tool analyzes the length and format of your text against best practices (e.g., ideal title length is 50-70 characters). It's a simple, non-AI guide to help you write better content."
      }
    ]
  },
  settings: {
    title: "Settings & Tools",
    icon: <SettingsIcon />,
    description: "Configure your site and run system diagnostics.",
    notes: [
      {
        icon: <Palette className="h-5 w-5 text-pink-500 mt-1 flex-shrink-0" />,
        title: "Theme & Branding",
        description: "Customize site colors (HSL), logo, and basic metadata in the 'General' tab."
      },
      {
        icon: <Megaphone className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />,
        title: "Marketing & Leads",
        description: "Use the 'Marketing' page to send WhatsApp messages using templates. View collected user leads in the 'Leads' page."
      },
      {
        icon: <AlertCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />,
        title: "System Tests",
        description: "Go to 'Settings' > 'Tests' to verify API connections (Payment, WhatsApp, Products, Blogs). Use this if you face data loading issues."
      }
    ]
  }
}

export default function InstructionsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-headline font-bold">Content Management Instructions</h1>
        <p className="text-muted-foreground mt-2">
          Your guide to adding and updating products, blogs, and images on Millet Yard.
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="products" className="flex items-center gap-2">
            {React.cloneElement(instructions.products.icon, { className: 'h-4 w-4' })}
            {instructions.products.title}
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            {React.cloneElement(instructions.images.icon, { className: 'h-4 w-4' })}
            {instructions.images.title}
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            {React.cloneElement(instructions.seo.icon, { className: 'h-4 w-4' })}
            {instructions.seo.title}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            {React.cloneElement(instructions.settings.icon, { className: 'h-4 w-4' })}
            {instructions.settings.title}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">{instructions.products.icon} {instructions.products.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-center">
                {instructions.products.steps.map((step, index) => (
                  <React.Fragment key={step.title}>
                    <div className="flex flex-col items-center gap-2 p-3 border rounded-lg max-w-44 h-full">
                      {step.icon}
                      <h4 className="font-semibold text-xs">{`${index + 1}. ${step.title}`}</h4>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                    {index < instructions.products.steps.length - 1 && <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">{instructions.images.icon} {instructions.images.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {instructions.images.notes.map(note => (
                <div key={note.title} className="flex items-start gap-3 p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg">
                  {note.icon}
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">{note.title}</h4>
                    <p className="text-sm text-muted-foreground">{note.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="coupons">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">{instructions.coupons.icon} {instructions.coupons.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-center">
                {instructions.coupons.steps.map((step, index) => (
                  <React.Fragment key={step.title}>
                    <div className="flex flex-col items-center gap-2 p-3 border rounded-lg max-w-44 h-full">
                      {step.icon}
                      <h4 className="font-semibold text-xs">{`${index + 1}. ${step.title}`}</h4>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">{instructions.seo.icon} {instructions.seo.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{instructions.seo.description}</p>
              {instructions.seo.notes.map(note => (
                <div key={note.title} className="flex items-start gap-3 p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-r-lg">
                  {note.icon}
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-300">{note.title}</h4>
                    <p className="text-sm text-muted-foreground">{note.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">{instructions.settings.icon} {instructions.settings.title}</CardTitle>
              <CardDescription>{instructions.settings.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instructions.settings.notes.map(note => (
                <div key={note.title} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  {note.icon}
                  <div>
                    <h4 className="font-semibold">{note.title}</h4>
                    <p className="text-sm text-muted-foreground">{note.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
