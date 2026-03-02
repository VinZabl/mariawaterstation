/* src/context/StoreContext.jsx */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const StoreContext = createContext();
export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [riders, setRiders] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [sales, setSales] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

    // ─── Load All Data on Mount ────────────────────────────────────────────────
    const fetchAll = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        const [
            { data: productsData },
            { data: categoriesData },
            { data: customersData },
            { data: ridersData },
            { data: deliveriesData },
            { data: salesData },
        ] = await Promise.all([
            supabase.from('products').select('*').order('id'),
            supabase.from('categories').select('*').order('name'),
            supabase.from('customers').select('*').order('registered_at', { ascending: false }),
            supabase.from('riders').select('*').order('id'),
            supabase.from('deliveries')
                .select('*, sales(*, sale_items(*))')
                .order('created_at', { ascending: false }),
            supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false }),
        ]);

        setProducts(productsData?.map(p => ({
            id: p.id, name: p.name, price: p.price, stock: p.stock,
            category: p.category, type: p.type, showInPos: p.show_in_pos
        })) ?? []);

        setCategories(categoriesData?.map(c => c.name) ?? []);

        setCustomers(customersData?.map(c => ({
            id: c.id, name: c.name, mobile: c.mobile,
            address: c.address, registeredDate: c.registered_at
        })) ?? []);

        setRiders(ridersData?.map(r => ({
            id: r.id, name: r.name, contact: r.contact, status: r.status
        })) ?? []);

        setDeliveries(deliveriesData?.map(d => ({
            id: d.id, orderId: d.sale_id, customerName: d.customer_name,
            address: d.address, rider: d.rider, status: d.status,
            items: (d.sales?.sale_items ?? []).map(i => ({
                id: i.product_id,
                name: i.product_name,
                price: i.price,
                quantity: i.quantity
            }))
        })) ?? []);

        setSales(salesData?.map(s => ({
            id: s.id,
            date: s.created_at,
            total: s.total,
            customerName: s.customer_name,
            paymentMethod: s.payment_method,
            jugStatus: s.jug_status,
            jugReturned: s.jug_returned,
            jugReturnedAt: s.jug_returned_at,
            isDelivery: s.is_delivery,
            items: (s.sale_items ?? []).map(i => ({
                id: i.product_id,
                name: i.product_name,
                price: i.price,
                quantity: i.quantity
            }))
        })) ?? []);

        setLoading(false);
    }, []);

    useEffect(() => { fetchAll(true); }, [fetchAll]);

    // ─── Products ─────────────────────────────────────────────────────────────
    const addProduct = async (product) => {
        const { error } = await supabase.from('products').insert({
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category,
            type: product.type,
            show_in_pos: product.showInPos !== undefined ? product.showInPos : true,
        });
        if (!error) await fetchAll();
    };

    const toggleProductPosVisibility = async (productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const { error } = await supabase
            .from('products')
            .update({ show_in_pos: !product.showInPos })
            .eq('id', productId);
        if (!error) {
            setProducts(prev =>
                prev.map(p => p.id === productId ? { ...p, showInPos: !p.showInPos } : p)
            );
        }
    };

    const updateProduct = async (productId, updatedData) => {
        const { error } = await supabase.from('products').update({
            name: updatedData.name,
            price: updatedData.price,
            stock: updatedData.stock,
            category: updatedData.category,
            type: updatedData.type,
            show_in_pos: updatedData.showInPos,
        }).eq('id', productId);
        if (!error) {
            setProducts(prev =>
                prev.map(p => p.id === productId ? { ...p, ...updatedData } : p)
            );
        }
    };

    const deleteProduct = async (productId) => {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (!error) {
            setProducts(prev => prev.filter(p => p.id !== productId));
        }
    };

    const updateStock = async (productId, quantity) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const newStock = product.stock - quantity;
        await supabase.from('products').update({ stock: newStock }).eq('id', productId);
        // Optimistic local update
        setProducts(prev =>
            prev.map(p => p.id === productId ? { ...p, stock: newStock } : p)
        );
    };

    // ─── Categories ───────────────────────────────────────────────────────────
    const addCategory = async (categoryName) => {
        if (categories.includes(categoryName)) return;
        const { error } = await supabase.from('categories').insert({ name: categoryName });
        if (!error) setCategories(prev => [...prev, categoryName]);
    };

    // ─── Customers ────────────────────────────────────────────────────────────
    const registerCustomer = async (customerData) => {
        const { error } = await supabase.from('customers').insert({
            name: customerData.name,
            mobile: customerData.mobile,
            address: customerData.address,
        });
        if (!error) await fetchAll();
    };

    // ─── Riders ───────────────────────────────────────────────────────────────
    const registerRider = async (riderData) => {
        const { error } = await supabase.from('riders').insert({
            name: riderData.name,
            contact: riderData.contact,
            status: 'Active',
        });
        if (!error) await fetchAll();
    };

    const updateRider = async (id, updatedData) => {
        const { error } = await supabase.from('riders').update(updatedData).eq('id', id);
        if (!error) {
            setRiders(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
        }
    };

    const deleteRider = async (id) => {
        const { error } = await supabase.from('riders').delete().eq('id', id);
        if (!error) setRiders(prev => prev.filter(r => r.id !== id));
    };

    // ─── Deliveries ───────────────────────────────────────────────────────────
    const updateDeliveryStatus = async (deliveryId, newStatus) => {
        const { error } = await supabase
            .from('deliveries')
            .update({ status: newStatus })
            .eq('id', deliveryId);
        if (!error) {
            setDeliveries(prev =>
                prev.map(d => d.id === deliveryId ? { ...d, status: newStatus } : d)
            );
        }
    };

    const markJugReturned = async (saleId) => {
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('sales')
            .update({ jug_returned: true, jug_returned_at: now })
            .eq('id', saleId);

        if (!error) {
            setSales(prev => prev.map(s =>
                s.id === saleId ? { ...s, jugReturned: true, jugReturnedAt: now } : s
            ));
        }
    };

    // ─── Cart ─────────────────────────────────────────────────────────────────
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const adjustCartQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const clearCart = () => setCart([]);

    // ─── Checkout ─────────────────────────────────────────────────────────────
    const processCheckout = async (checkoutData) => {
        const { customerName, paymentMethod, isDelivery, riderName, jugStatus, address } = checkoutData;
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 1. Insert Sale
        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert({
                customer_name: customerName || 'Walk-in',
                total,
                payment_method: paymentMethod,
                jug_status: jugStatus,
                is_delivery: isDelivery,
            })
            .select()
            .single();

        if (saleError || !saleData) {
            console.error('Sale insert error:', saleError);
            return;
        }

        // 2. Insert Sale Items
        const saleItems = cart.map(item => ({
            sale_id: saleData.id,
            product_id: item.id,
            product_name: item.name,
            price: item.price,
            quantity: item.quantity,
        }));
        await supabase.from('sale_items').insert(saleItems);

        // 3. Reduce Stock (run in parallel)
        await Promise.all(cart.map(item => updateStock(item.id, item.quantity)));

        // 4. Insert Delivery if needed
        if (isDelivery) {
            await supabase.from('deliveries').insert({
                sale_id: saleData.id,
                customer_name: customerName || 'Guest',
                address: address || 'N/A',
                rider: riderName || 'Unassigned',
                status: 'Pending',
            });
        }

        clearCart();
        await fetchAll(); // Refresh all state from DB
    };

    // ─── Admin Authentication ──────────────────────────────────────────────────
    const loginAdmin = async (passwordInput) => {
        const { data, error } = await supabase.from('app_settings').select('admin_password').eq('id', 1).single();
        if (!error && data && data.admin_password === passwordInput) {
            setIsAdminAuthenticated(true);
            return true;
        }
        return false;
    };

    const logoutAdmin = () => {
        setIsAdminAuthenticated(false);
    };

    const updateAdminPassword = async (newPassword) => {
        const { error } = await supabase.from('app_settings').update({ admin_password: newPassword }).eq('id', 1);
        return !error;
    };

    return (
        <StoreContext.Provider value={{
            loading,
            products,
            cart,
            deliveries,
            sales,
            categories,
            customers,
            riders,
            addProduct,
            updateProduct,
            deleteProduct,
            toggleProductPosVisibility,
            addCategory,
            registerCustomer,
            registerRider,
            updateRider,
            deleteRider,
            updateDeliveryStatus,
            markJugReturned,
            addToCart,
            removeFromCart,
            adjustCartQuantity,
            clearCart,
            processCheckout,
            isAdminAuthenticated,
            loginAdmin,
            logoutAdmin,
            updateAdminPassword,
        }}>
            {children}
        </StoreContext.Provider>
    );
};
