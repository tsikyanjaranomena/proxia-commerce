import { useCallback, useRef, useState } from 'react';
import { AuthSheet } from './components/AuthSheet.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { Footer } from './components/Footer.jsx';
import { Header } from './components/Header.jsx';
import { LoginPrompt } from './components/LoginPrompt.jsx';
import { OrdersList } from './components/OrdersList.jsx';
import { ProductModal } from './components/ProductModal.jsx';
import { Toasts } from './components/ui/Toasts.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useCart } from './hooks/useCart.js';
import { useClaims } from './hooks/useClaims.js';
import { useHashRouter } from './hooks/useHashRouter.js';
import { useOrders } from './hooks/useOrders.js';
import { usePersistentState } from './hooks/usePersistentState.js';
import { useProducts } from './hooks/useProducts.js';
import { useToasts } from './hooks/useToasts.js';
import { CartPage } from './pages/CartPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { ClaimPage } from './pages/ClaimPage.jsx';
import { RiderPage } from './pages/RiderPage.jsx';
import { StorePage } from './pages/StorePage.jsx';
import { TrackingPage } from './pages/TrackingPage.jsx';

/** Composant racine : assemble le routage, l'état global (hooks) et les pages. */
export default function App() {
  const { view, id, navigate } = useHashRouter();
  const { toasts, toast, dismiss } = useToasts();
  const auth = useAuth();
  const catalog = useProducts();
  const { lines, count, subtotal, add, setQty, remove, clear } = useCart(catalog.products);
  const orders = useOrders(auth.token);
  const { claims, submitClaim } = useClaims(auth.token);
  const [profile, setProfile] = usePersistentState('profile', {});
  const [selected, setSelected] = useState(null);

  // Connexion à la demande : `requireAuth(action)` exécute l'action tout de suite si le client
  // est connecté, sinon après la vérification de son numéro.
  const [authPrompt, setAuthPrompt] = useState(null);
  const afterAuth = useRef(null);
  const requireAuth = useCallback(
    (action, prefill = {}) => {
      if (auth.isAuthed) return action?.();
      afterAuth.current = action || null;
      setAuthPrompt({ phone: prefill.phone || profile.phone || '', name: prefill.name || profile.name || '' });
      return undefined;
    },
    [auth.isAuthed, profile.phone, profile.name]
  );

  const addToCart = useCallback(
    (product, qty = 1) => {
      add(product, qty);
      toast(`${product.name} ajouté au panier`);
    },
    [add, toast]
  );

  const reloadCatalog = catalog.reload;
  const onOrderPlaced = useCallback(
    (order) => {
      clear();
      reloadCatalog(); // les stocks ont changé
      navigate('orders', order.id);
      toast(order.payment?.method === 'mobile' ? 'Paiement reçu, commande confirmée !' : 'Commande confirmée !');
    },
    [clear, reloadCatalog, navigate, toast]
  );

  const onSubmitClaim = useCallback(
    async (form) => {
      const claim = await submitClaim(form);
      toast(`Réclamation ${claim.id} envoyée. Nous vous rappelons sous 2 h.`);
    },
    [submitClaim, toast]
  );

  const trackedOrder = view === 'orders' && id ? orders.orders.find((o) => o.id === id) : null;
  const isRider = view === 'rider';

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header view={view} navigate={navigate} cartCount={count} activeCount={orders.activeCount} />

      <main className="flex-1">
        {view === 'shop' && (
          <StorePage products={catalog.products} cartLines={lines} loading={catalog.loading} error={catalog.error} onRetry={catalog.reload} onOpenProduct={setSelected} onAdd={addToCart} />
        )}
        {view === 'cart' && <CartPage cartLines={lines} subtotal={subtotal} setQty={setQty} removeItem={remove} navigate={navigate} />}
        {view === 'checkout' && (
          <CheckoutPage
            cartLines={lines}
            subtotal={subtotal}
            profile={profile}
            setProfile={setProfile}
            requireAuth={requireAuth}
            orders={orders}
            onOrderPlaced={onOrderPlaced}
            navigate={navigate}
            toast={toast}
          />
        )}
        {view === 'orders' &&
          (!auth.isAuthed ? (
            <LoginPrompt title="Suivez vos commandes" text="Connectez-vous avec votre numéro pour retrouver vos commandes et suivre votre livreur en direct." onLogin={() => requireAuth()} />
          ) : trackedOrder ? (
            <TrackingPage key={trackedOrder.id} order={trackedOrder} orders={orders} navigate={navigate} toast={toast} />
          ) : (
            <OrdersList orders={orders.orders} loading={orders.loading} navigate={navigate} />
          ))}
        {view === 'support' && (
          <ClaimPage
            orders={orders.orders}
            claims={claims}
            prefillOrderId={id}
            auth={auth}
            onLogin={() => requireAuth()}
            onSubmitClaim={onSubmitClaim}
          />
        )}
        {isRider && <RiderPage toast={toast} />}
      </main>

      {view !== 'checkout' && !isRider && <Footer navigate={navigate} />}

      {!isRider && <BottomNav view={view} navigate={navigate} cartCount={count} activeCount={orders.activeCount} />}

      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={(p, q) => {
          addToCart(p, q);
          setSelected(null);
        }}
        onBuyNow={(p, q) => {
          addToCart(p, q);
          setSelected(null);
          navigate('checkout');
        }}
      />

      {authPrompt && (
        <AuthSheet
          auth={auth}
          initialPhone={authPrompt.phone}
          name={authPrompt.name}
          onClose={() => {
            afterAuth.current = null;
            setAuthPrompt(null);
          }}
          onSuccess={() => {
            const action = afterAuth.current;
            afterAuth.current = null;
            setAuthPrompt(null);
            toast('Vous êtes connecté.');
            action?.();
          }}
        />
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
