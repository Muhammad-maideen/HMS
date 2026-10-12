import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Sparkles, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { api, getRole } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function PricingVariantsPage({ refreshTrigger }) {
  const { addToast } = useToast();
  const currentRole = getRole();
  const canModify = currentRole === 'admin' || currentRole === 'manager';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // Editable price matrix buffer
  const [priceBuffer, setPriceBuffer] = useState({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({ all: '1' });
      const prods = res.data || [];
      setProducts(prods);

      // Initialize buffer
      const buf = {};
      prods.forEach(p => {
        buf[p.id] = {
          base_price: p.base_price,
          offer_price: p.offer_price || '',
          dine_in_price: p.dine_in_price || p.base_price,
          takeaway_price: p.takeaway_price || p.base_price,
          delivery_price: p.delivery_price || (p.base_price * 1.1),
          variants: (p.variants || []).map(v => ({ ...v })),
        };
      });
      setPriceBuffer(buf);
    } catch (err) {
      addToast(err.message || 'Failed to load pricing matrix', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]);

  const handlePriceChange = (productId, field, value) => {
    setPriceBuffer(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const handleVariantPriceChange = (productId, variantIndex, field, value) => {
    setPriceBuffer(prev => {
      const pData = { ...prev[productId] };
      const variants = [...pData.variants];
      variants[variantIndex] = { ...variants[variantIndex], [field]: value };
      pData.variants = variants;
      return { ...prev, [productId]: pData };
    });
  };

  const handleAddVariantToProduct = (productId) => {
    setPriceBuffer(prev => {
      const pData = { ...prev[productId] };
      const basePrice = pData.base_price || 150;
      pData.variants = [
        ...pData.variants,
        {
          variant_name: 'Special Portion',
          regular_price: basePrice,
          offer_price: '',
          is_available: true,
        }
      ];
      return { ...prev, [productId]: pData };
    });
  };

  const handleRemoveVariant = (productId, variantIndex) => {
    setPriceBuffer(prev => {
      const pData = { ...prev[productId] };
      pData.variants = pData.variants.filter((_, i) => i !== variantIndex);
      return { ...prev, [productId]: pData };
    });
  };

  const handleSavePrices = async (productId) => {
    if (!canModify) {
      addToast(`Role '${currentRole}' is unauthorized to alter prices`, 'error');
      return;
    }

    const row = priceBuffer[productId];
    if (!row) return;

    const basePriceNum = parseFloat(row.base_price);
    const offerPriceNum = row.offer_price ? parseFloat(row.offer_price) : null;

    if (!basePriceNum || basePriceNum <= 0) {
      addToast('Regular selling price must be greater than zero', 'error');
      return;
    }

    if (offerPriceNum !== null && offerPriceNum >= basePriceNum) {
      addToast('Offer price must be strictly less than the regular price', 'error');
      return;
    }

    try {
      setSavingId(productId);
      const payload = {
        base_price: basePriceNum,
        offer_price: offerPriceNum,
        dine_in_price: row.dine_in_price ? parseFloat(row.dine_in_price) : basePriceNum,
        takeaway_price: row.takeaway_price ? parseFloat(row.takeaway_price) : basePriceNum,
        delivery_price: row.delivery_price ? parseFloat(row.delivery_price) : (basePriceNum * 1.1),
        variants: row.variants.map(v => ({
          ...v,
          regular_price: parseFloat(v.regular_price) || 0,
          offer_price: v.offer_price ? parseFloat(v.offer_price) : null,
        })),
      };

      await api.updateProduct(productId, payload);
      addToast('Price updates saved and recalculated securely!', 'success');
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Failed to update pricing', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto animate-fadeIn">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-neutral-900" />
            Dynamic Pricing & Portion Matrix
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time selling prices, promotional discounts, channel rates (Dine-in, Takeaway, Delivery), and portion variant pricing.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="p-2 text-neutral-600 hover:text-black bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm transition-all self-start md:self-auto"
          title="Refresh Prices"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-black' : ''}`} />
        </button>
      </div>

      {/* Info Notice */}
      <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between gap-4 text-xs text-neutral-700">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-neutral-900 shrink-0" />
          <span>
            <strong>Historical Integrity:</strong> Price edits immediately update the menu and POS for new customers, while previously completed invoices remain frozen.
          </span>
        </div>
      </div>

      {/* Pricing Matrix */}
      {loading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-neutral-500 font-medium">Loading pricing matrix...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((p) => {
            const buf = priceBuffer[p.id] || {};
            const basePrice = parseFloat(buf.base_price) || 0;
            const offerPrice = buf.offer_price !== '' && buf.offer_price !== null ? parseFloat(buf.offer_price) : 0;
            const hasActiveOffer = offerPrice > 0 && offerPrice < basePrice;
            const discountPct = hasActiveOffer ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0;
            const isSaving = savingId === p.id;

            return (
              <div key={p.id} className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-4">
                
                {/* Product row header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100'}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover border border-neutral-200"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                        {p.name}
                        <span className="text-[10px] font-mono text-neutral-400 font-normal">({p.sku})</span>
                      </h3>
                      <span className="text-[11px] text-neutral-500 font-medium">{p.category?.name}</span>
                    </div>
                  </div>

                  {/* Prominent Live Price & Save Button */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-neutral-400 block">Selling Price</span>
                      <div className="flex items-baseline gap-1.5 justify-end">
                        {hasActiveOffer ? (
                          <>
                            <span className="text-lg font-mono font-bold text-neutral-900">
                              ₹{offerPrice.toFixed(2)}
                            </span>
                            <span className="text-xs font-mono line-through text-neutral-400">
                              ₹{basePrice.toFixed(2)}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-black text-white text-[10px] font-medium">
                              {discountPct}% OFF
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-mono font-bold text-neutral-900">
                            ₹{basePrice > 0 ? basePrice.toFixed(2) : '0.00'}
                          </span>
                        )}
                      </div>
                    </div>

                    {canModify && (
                      <button
                        onClick={() => handleSavePrices(p.id)}
                        disabled={isSaving}
                        className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Update'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Pricing Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-neutral-600 font-medium mb-1">
                      Regular Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={buf.base_price ?? ''}
                      onChange={(e) => handlePriceChange(p.id, 'base_price', e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 font-medium mb-1">
                      Offer Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={buf.offer_price ?? ''}
                      onChange={(e) => handlePriceChange(p.id, 'offer_price', e.target.value)}
                      placeholder="Optional"
                      className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">Dine-In (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={buf.dine_in_price ?? ''}
                      onChange={(e) => handlePriceChange(p.id, 'dine_in_price', e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">Takeaway (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={buf.takeaway_price ?? ''}
                      onChange={(e) => handlePriceChange(p.id, 'takeaway_price', e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-600 mb-1">Delivery (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={buf.delivery_price ?? ''}
                      onChange={(e) => handlePriceChange(p.id, 'delivery_price', e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Portions / Variants Section */}
                {buf.variants && buf.variants.length > 0 && (
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                        Portion / Size Variations
                      </span>
                      {canModify && (
                        <button
                          type="button"
                          onClick={() => handleAddVariantToProduct(p.id)}
                          className="text-[11px] font-medium text-neutral-800 hover:text-black flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Size
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {buf.variants.map((v, vIdx) => {
                        const vReg = parseFloat(v.regular_price) || 0;
                        const vOff = v.offer_price ? parseFloat(v.offer_price) : 0;
                        const vHasOffer = vOff > 0 && vOff < vReg;
                        return (
                          <div key={vIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-neutral-200 text-xs">
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                value={v.variant_name}
                                onChange={(e) => handleVariantPriceChange(p.id, vIdx, 'variant_name', e.target.value)}
                                placeholder="Portion Name"
                                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-neutral-900 font-medium text-xs focus:outline-none focus:border-black"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-neutral-500">Regular: ₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={v.regular_price}
                                  onChange={(e) => handleVariantPriceChange(p.id, vIdx, 'regular_price', e.target.value)}
                                  className="w-full bg-white border border-neutral-300 rounded-lg px-2 py-1 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                                />
                              </div>
                            </div>
                            <div className="sm:col-span-3">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-neutral-500">Offer: ₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={v.offer_price ?? ''}
                                  onChange={(e) => handleVariantPriceChange(p.id, vIdx, 'offer_price', e.target.value)}
                                  placeholder="None"
                                  className="w-full bg-white border border-neutral-300 rounded-lg px-2 py-1 text-neutral-900 font-mono text-xs focus:outline-none focus:border-black"
                                />
                              </div>
                            </div>
                            <div className="sm:col-span-2 flex items-center justify-end gap-2">
                              {vHasOffer && (
                                <span className="text-[10px] font-semibold text-neutral-800 font-mono">
                                  Save ₹{(vReg - vOff).toFixed(0)}
                                </span>
                              )}
                              {canModify && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(p.id, vIdx)}
                                  className="p-1 text-neutral-400 hover:text-black"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Variant button if none */}
                {(!buf.variants || buf.variants.length === 0) && canModify && (
                  <button
                    type="button"
                    onClick={() => handleAddVariantToProduct(p.id)}
                    className="text-xs text-neutral-500 hover:text-black flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Portion Sizes (Half / Full / Bucket)</span>
                  </button>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
