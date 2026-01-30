/**
 * DATA MANAGER (core/data.js)
 * Gestion centralisée et sécurisée du LocalStorage.
 * Source de vérité unique pour Menu et Admin.
 */

const DB_KEYS = {
    PRODUCTS: 'app_products_v2', // Changé pour forcer une réinitialisation propre
    ORDERS: 'app_orders_v2'
};

// DONNÉES PAR DÉFAUT (Structure stricte)
const DEFAULT_MENU = [
    {id: 101, cat: "Tagines Salés", name: "Tagine Agneau", price: 42, img: "../menu/image/Tagine de veau aux légumes.jpg", active: true},
    {id: 102, cat: "Tagines Salés", name: "Tagine Kefta", price: 36, img: "../menu/image/Tagine kefta aux œufs.jpg", active: true},
    {id: 201, cat: "Tagines Sucrés", name: "Tagine l’Oasis", price: 46, img: "../menu/image/Tagine l’Oasis.jpg", active: true},
    {id: 401, cat: "Panuozzo", name: "Panuozzo Poulet", price: 10.5, img: "../menu/image/Panuozzo Poulet Grillé.jpg", active: true},
    {id: 601, cat: "Ettounsi", name: "Sandwich Thon", price: 9.8, img: "../menu/image/sandwich thon.jpg", active: true}
];

const DataManager = {
    // Initialisation Robuste
    init() {
        // Gestion Produits
        const storedProducts = localStorage.getItem(DB_KEYS.PRODUCTS);
        if (!storedProducts || storedProducts === '[]' || storedProducts === 'null') {
            console.log("♻️ Réinitialisation de la base produits...");
            localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(DEFAULT_MENU));
        }

        // Gestion Commandes
        const storedOrders = localStorage.getItem(DB_KEYS.ORDERS);
        if (!storedOrders) {
            localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify([]));
        }
    },

    // --- PRODUITS ---
    getProducts() {
        this.init();
        try {
            return JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS)) || [];
        } catch (e) {
            console.error("Erreur lecture produits, reset forcé.");
            localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(DEFAULT_MENU));
            return DEFAULT_MENU;
        }
    },

    getActiveProducts() {
        // Filtre strict : active doit être true
        return this.getProducts().filter(p => p.active === true);
    },

    addProduct(product) {
        const products = this.getProducts();
        // ID unique basé sur le temps + aléatoire pour éviter les doublons
        product.id = Date.now() + Math.floor(Math.random() * 1000);
        products.push(product);
        this.saveProducts(products);
    },

    updateProduct(updatedProduct) {
        let products = this.getProducts();
        const index = products.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
            products[index] = updatedProduct;
            this.saveProducts(products);
        }
    },

    deleteProduct(id) {
        let products = this.getProducts();
        products = products.filter(p => p.id !== id);
        this.saveProducts(products);
    },

    saveProducts(products) {
        localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
    },

    // --- COMMANDES ---
    getOrders() {
        this.init();
        try {
            return JSON.parse(localStorage.getItem(DB_KEYS.ORDERS)) || [];
        } catch (e) { return []; }
    },

    addOrder(order) {
        const orders = this.getOrders();
        // Structure forcée pour éviter les bugs
        const cleanOrder = {
            orderId: order.orderId,
            items: order.items,
            total: parseFloat(order.total),
            type: order.type,
            table: order.table || 'N/A',
            timestamp: new Date().toISOString(), // Standard ISO pour le stockage
            status: 'pending'
        };
        orders.push(cleanOrder);
        localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
    },

    updateOrderStatus(orderId, status) {
        const orders = this.getOrders();
        const order = orders.find(o => o.orderId === orderId);
        if (order) {
            order.status = status;
            localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
        }
    }
};

// Démarrage immédiat
DataManager.init();