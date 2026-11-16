'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Category } from '@/types/marketplace';
import { useAuth } from '@/hooks/useAuth';
import {
  Upload,
  Image as ImageIcon,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Tag,
} from 'lucide-react';

interface UploadedImage {
  image_url: string;
  cloudinary_public_id: string;
  display_order: number;
}

export default function CreateListingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);
  const [categories, setCategories] = useState<Category[]>([]);

  // Step 1: Photos
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  // Step 2: Details
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState<'like_new' | 'excellent' | 'good' | 'fair'>('like_new');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');

  // Step 3: Pricing
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');

  // General & Field Error states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    images?: string;
    title?: string;
    category?: string;
    description?: string;
    price?: string;
  }>({});

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await apiClient.get<Category[]>('/categories');
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, [categoryId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      setError('You can upload a maximum of 5 photos per listing.');
      return;
    }

    setUploading(true);
    setError(null);
    setFieldErrors((prev) => ({ ...prev, images: undefined }));

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await apiClient.post<UploadedImage>('/uploads/listing-images', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setImages((prev) => [
          ...prev,
          {
            image_url: res.image_url,
            cloudinary_public_id: res.cloudinary_public_id,
            display_order: prev.length,
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    if (uploading) {
      setError('Please wait for photos to finish uploading.');
      return false;
    }
    if (images.length === 0) {
      setError('Please upload at least 1 photo of your item to proceed.');
      setFieldErrors({ images: 'At least 1 photo is required.' });
      return false;
    }
    setError(null);
    setFieldErrors({});
    return true;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const newFieldErrors: typeof fieldErrors = {};
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      newFieldErrors.title = 'Listing title is required.';
    } else if (trimmedTitle.length < 3) {
      newFieldErrors.title = 'Title must be at least 3 characters.';
    }

    if (!categoryId) {
      newFieldErrors.category = 'Please select a category.';
    }

    if (!trimmedDesc) {
      newFieldErrors.description = 'Description is required.';
    } else if (trimmedDesc.length < 10) {
      newFieldErrors.description = `Description is too short (${trimmedDesc.length}/10 characters minimum).`;
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('Please fill in the required product details before continuing.');
      return false;
    }

    setError(null);
    setFieldErrors({});
    return true;
  };

  // Step 3 Validation
  const validateStep3 = (): boolean => {
    const newFieldErrors: typeof fieldErrors = {};
    const p = parseFloat(price);

    if (!price || isNaN(p) || p <= 0) {
      newFieldErrors.price = 'Please enter a valid price greater than ₹0.';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('Please enter a valid selling price in ₹ INR.');
      return false;
    }

    setError(null);
    setFieldErrors({});
    return true;
  };

  // Navigation handlers
  const handleProceedToDetails = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setMaxStepReached((prev) => Math.max(prev, 2));
    }
  };

  const handleProceedToPricing = () => {
    if (validateStep2()) {
      setCurrentStep(3);
      setMaxStepReached((prev) => Math.max(prev, 3));
    }
  };

  const handleProceedToPreview = () => {
    if (validateStep3()) {
      setCurrentStep(4);
      setMaxStepReached((prev) => Math.max(prev, 4));
    }
  };

  const handleStepClick = (stepNum: 1 | 2 | 3 | 4) => {
    if (stepNum === currentStep) return;
    if (stepNum < currentStep) {
      // Always allowed to go backward
      setError(null);
      setCurrentStep(stepNum);
      return;
    }
    // Going forward requires validating intermediate steps
    if (stepNum >= 2 && !validateStep1()) return;
    if (stepNum >= 3 && !validateStep2()) return;
    if (stepNum >= 4 && !validateStep3()) return;

    setError(null);
    setCurrentStep(stepNum);
    setMaxStepReached((prev) => Math.max(prev, stepNum));
  };

  const handleCreateListing = async (status: 'draft' | 'active') => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        condition,
        brand: brand.trim() || null,
        status,
        images,
      };

      const res = await apiClient.post<{ id: string }>('/seller/listings', payload);
      router.push(`/product/${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save listing. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.name || 'Category';

  const priceNum = parseFloat(price) || 0;
  const origNum = parseFloat(originalPrice) || 0;
  const discountPercent =
    origNum > priceNum ? Math.round(((origNum - priceNum) / origNum) * 100) : null;

  const isStep2Valid = title.trim().length >= 3 && categoryId && description.trim().length >= 10;
  const isStep1Valid = images.length >= 1;
  const isStep3Valid = priceNum > 0;

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-[#191c1a] py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Wizard Stepper Header */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1a3a2a] block mb-1">
            Seller Portal • Create Listing
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#191c1a] mb-6">
            List a pre-owned item on campus
          </h1>

          {/* Interactive Stepper Progress Bar */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1 as const, label: 'Photos' },
              { num: 2 as const, label: 'Details' },
              { num: 3 as const, label: 'Pricing' },
              { num: 4 as const, label: 'Preview' },
            ].map((step) => {
              const isCurrent = currentStep === step.num;
              const isAccessible = step.num <= maxStepReached || step.num < currentStep;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => handleStepClick(step.num)}
                  className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer text-left w-full ${
                    isCurrent
                      ? 'bg-[#1a3a2a] text-white border-[#1a3a2a] shadow-xs'
                      : isAccessible
                      ? 'bg-[#e8f0eb] text-[#1a3a2a] border-[#d8e5dc] hover:bg-[#dce9e0]'
                      : 'bg-white text-[#8a938c] border-[#e2ded6] hover:bg-[#faf9f6]'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider">
                    Step {step.num}
                  </div>
                  <div className="text-xs font-semibold truncate">{step.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-rose-800 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Wizard Content Card */}
        <div className="bg-white rounded-3xl border border-[#e2ded6] p-6 sm:p-10 shadow-sm">
          {/* STEP 1: PHOTOS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#191c1a] mb-1">
                  Upload Product Photos
                </h2>
                <p className="text-xs text-[#5c645d]">
                  Add between 1 and 5 clear photos of the item. First photo will be your primary display photo.
                </p>
              </div>

              {/* Upload Dropzone */}
              {images.length < 5 && (
                <label
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-[#fdfdfc] ${
                    fieldErrors.images
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-[#d8e5dc] hover:border-[#1a3a2a]'
                  }`}
                >
                  <Upload className="w-8 h-8 text-[#1a3a2a] mb-2" />
                  <span className="text-xs font-semibold text-[#191c1a] mb-1">
                    {uploading ? 'Uploading to campus storage...' : 'Click or drag photos here'}
                  </span>
                  <span className="text-[11px] text-[#8a938c]">
                    JPEG, PNG or WebP • Max 5 MB per image • {5 - images.length} remaining
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              )}

              {fieldErrors.images && (
                <p className="text-xs font-medium text-rose-600">{fieldErrors.images}</p>
              )}

              {/* Uploaded Photos Grid */}
              {images.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5c645d] mb-3">
                    Uploaded Photos ({images.length}/5)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-2xl overflow-hidden border border-[#e2ded6] group bg-[#f5f3ee]"
                      >
                        <img
                          src={img.image_url}
                          alt={`Uploaded ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1a3a2a] text-white">
                            Primary
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
                          aria-label="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#edeae2] flex justify-end">
                <button
                  type="button"
                  onClick={handleProceedToDetails}
                  className={`px-6 py-2.5 rounded-xl text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition ${
                    isStep1Valid
                      ? 'bg-[#1a3a2a] hover:bg-[#132c1f]'
                      : 'bg-[#1a3a2a]/70 hover:bg-[#1a3a2a]'
                  }`}
                >
                  <span>Continue to Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#191c1a] mb-1">
                  Product Details
                </h2>
                <p className="text-xs text-[#5c645d]">
                  Describe the item clearly so other campus students can easily find it.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5c645d]">
                      Listing Title *
                    </label>
                    <span
                      className={`text-[11px] ${
                        title.trim().length >= 3 ? 'text-emerald-700 font-semibold' : 'text-[#8a938c]'
                      }`}
                    >
                      {title.trim().length >= 3 ? '✓ Min 3 chars' : 'Min 3 characters'}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Casio fx-991EX ClassWiz Scientific Calculator"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (fieldErrors.title) {
                        setFieldErrors((prev) => ({ ...prev, title: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-[#fdfdfc] text-[#191c1a] text-sm focus:outline-none transition ${
                      fieldErrors.title
                        ? 'border-rose-400 ring-2 ring-rose-100'
                        : 'border-[#e2ded6] focus:border-[#1a3a2a]'
                    }`}
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5c645d] mb-1.5">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        if (fieldErrors.category) {
                          setFieldErrors((prev) => ({ ...prev, category: undefined }));
                        }
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl border bg-[#fdfdfc] text-[#191c1a] text-xs focus:outline-none transition ${
                        fieldErrors.category
                          ? 'border-rose-400 ring-2 ring-rose-100'
                          : 'border-[#e2ded6] focus:border-[#1a3a2a]'
                      }`}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.category && (
                      <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5c645d] mb-1.5">
                      Brand / Manufacturer (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Casio, Nike, HC Verma, Dell"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] text-xs focus:outline-none focus:border-[#1a3a2a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5c645d] mb-1.5">
                    Condition *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { val: 'like_new', label: 'Like New', desc: 'No flaws' },
                      { val: 'excellent', label: 'Excellent', desc: 'Minimal wear' },
                      { val: 'good', label: 'Good', desc: 'Normal wear' },
                      { val: 'fair', label: 'Fair', desc: 'Noticeable wear' },
                    ].map((c) => (
                      <button
                        key={c.val}
                        type="button"
                        onClick={() => setCondition(c.val as any)}
                        className={`p-3 rounded-xl border text-left transition ${
                          condition === c.val
                            ? 'bg-[#e8f0eb] border-[#1a3a2a] text-[#1a3a2a] ring-1 ring-[#1a3a2a]'
                            : 'border-[#e2ded6] text-[#5c645d] hover:bg-[#f5f3ee]'
                        }`}
                      >
                        <div className="text-xs font-bold">{c.label}</div>
                        <div className="text-[10px] text-[#8a938c]">{c.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5c645d]">
                      Full Description *
                    </label>
                    <span
                      className={`text-[11px] ${
                        description.trim().length >= 10
                          ? 'text-emerald-700 font-semibold'
                          : 'text-[#8a938c]'
                      }`}
                    >
                      {description.trim().length >= 10
                        ? `✓ ${description.trim().length} chars (valid)`
                        : `${description.trim().length} / 10 characters minimum`}
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about semester usage, included cables/accessories, or reasons for selling."
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (fieldErrors.description) {
                        setFieldErrors((prev) => ({ ...prev, description: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-[#fdfdfc] text-[#191c1a] text-sm focus:outline-none transition ${
                      fieldErrors.description
                        ? 'border-rose-400 ring-2 ring-rose-100'
                        : 'border-[#e2ded6] focus:border-[#1a3a2a]'
                    }`}
                  />
                  {fieldErrors.description && (
                    <p className="mt-1 text-xs font-medium text-rose-600">
                      {fieldErrors.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#edeae2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-[#e2ded6] text-[#5c645d] text-xs font-semibold hover:bg-[#f5f3ee] flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Photos</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPricing}
                  className={`px-6 py-2.5 rounded-xl text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition ${
                    isStep2Valid
                      ? 'bg-[#1a3a2a] hover:bg-[#132c1f]'
                      : 'bg-[#1a3a2a]/70 hover:bg-[#1a3a2a]'
                  }`}
                >
                  <span>Continue to Pricing</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PRICING */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#191c1a] mb-1">
                  Pricing in Indian Rupees (₹)
                </h2>
                <p className="text-xs text-[#5c645d]">
                  Set a fair thrift price. ReThread does not take any commission.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5c645d] mb-1.5">
                      Your Selling Price (₹ INR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#1a3a2a]">
                        ₹
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        placeholder="950"
                        value={price}
                        onChange={(e) => {
                          setPrice(e.target.value);
                          if (fieldErrors.price) {
                            setFieldErrors((prev) => ({ ...prev, price: undefined }));
                          }
                        }}
                        className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border bg-[#fdfdfc] text-[#191c1a] text-sm font-bold focus:outline-none transition ${
                          fieldErrors.price
                            ? 'border-rose-400 ring-2 ring-rose-100'
                            : 'border-[#e2ded6] focus:border-[#1a3a2a]'
                        }`}
                      />
                    </div>
                    {fieldErrors.price && (
                      <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5c645d] mb-1.5">
                      Original Retail Price (₹ INR, Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8a938c]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1495"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#e2ded6] bg-[#fdfdfc] text-[#191c1a] text-sm focus:outline-none focus:border-[#1a3a2a]"
                      />
                    </div>
                  </div>
                </div>

                {discountPercent && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Buyers will see a <strong>{discountPercent}% savings</strong> banner on this listing!
                    </span>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-[#f5f3ee] border border-[#e2ded6] text-xs text-[#5c645d] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#191c1a]">
                    <ShieldCheck className="w-4 h-4 text-[#1a3a2a]" />
                    <span>Campus In-Person Meetup Reminder</span>
                  </div>
                  <p>
                    All payments are settled offline between you and the buyer at your designated campus hostel or library landmark.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#edeae2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-[#e2ded6] text-[#5c645d] text-xs font-semibold hover:bg-[#f5f3ee] flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Details</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPreview}
                  className={`px-6 py-2.5 rounded-xl text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition ${
                    isStep3Valid
                      ? 'bg-[#1a3a2a] hover:bg-[#132c1f]'
                      : 'bg-[#1a3a2a]/70 hover:bg-[#1a3a2a]'
                  }`}
                >
                  <span>Preview Listing</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW & PUBLISH */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#191c1a] mb-1">
                  Preview Your Listing
                </h2>
                <p className="text-xs text-[#5c645d]">
                  Review how your product card and details will appear to other students.
                </p>
              </div>

              {/* Preview Card */}
              <div className="p-6 rounded-3xl bg-[#f5f3ee] border border-[#e2ded6] flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-56 aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-[#e2ded6] shrink-0">
                  {images[0] ? (
                    <img
                      src={images[0].image_url}
                      alt="Primary"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8a938c]">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-[#1a3a2a] uppercase tracking-wider block mb-1">
                      {selectedCategoryName}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#191c1a] mb-2">
                      {title}
                    </h3>
                    <p className="text-xs text-[#5c645d] line-clamp-3 mb-3">
                      {description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#edeae2] flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-2xl text-[#1a3a2a]">
                        ₹ {priceNum.toLocaleString('en-IN')}
                      </span>
                      {origNum > priceNum && (
                        <span className="text-xs text-[#8a938c] line-through">
                          ₹ {origNum.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white border border-[#e2ded6] text-[#191c1a]">
                      {condition.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="pt-4 border-t border-[#edeae2] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 rounded-xl border border-[#e2ded6] text-[#5c645d] text-xs font-semibold hover:bg-[#f5f3ee] flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Pricing</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCreateListing('draft')}
                    className="px-4 py-2.5 rounded-xl border border-[#1a3a2a] text-[#1a3a2a] text-xs font-semibold hover:bg-[#e8f0eb] transition disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCreateListing('active')}
                    className="px-6 py-2.5 rounded-xl bg-[#1a3a2a] hover:bg-[#132c1f] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <span>Publish to Campus</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
