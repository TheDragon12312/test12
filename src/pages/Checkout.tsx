import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Shield,
  Lock,
  Loader2,
  Target,
  Star,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { pricingService, PricingPlan } from "@/lib/pricing-service";
import { discountService } from "@/lib/discount-service";
import { paddleService } from "@/lib/paddle-service";
import { toast } from "sonner";

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [checkoutSession, setCheckoutSession] = useState<any>(null);
  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percentage: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState("");

  const planFromUrl = searchParams.get("plan");
  const cycleFromUrl = searchParams.get("cycle");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (planFromUrl) setSelectedPlan(planFromUrl);
    if (cycleFromUrl) setBillingCycle(cycleFromUrl);

    // Load plan details
    const planDetails = pricingService.getPlan(planFromUrl || selectedPlan);
    setPlan(planDetails);

    // If we have a session ID, load checkout session
    if (sessionId) {
      const session = pricingService.getCheckoutSession(sessionId);
      setCheckoutSession(session);
    }
  }, [planFromUrl, cycleFromUrl, selectedPlan, sessionId]);

  const handleCheckout = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!plan) {
      toast.error("Geen plan geselecteerd");
      return;
    }

    setIsLoading(true);

    try {
      // Use Paddle for real subscription payments
      const productId =
        billingCycle === "yearly"
          ? `${selectedPlan}_yearly`
          : `${selectedPlan}_monthly`;

      await paddleService.openCheckout({
        productId,
        customerId: user.id || user.email || "anonymous",
        email: user.email,
        successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        closeUrl: window.location.href,
        customData: {
          planId: selectedPlan,
          billingCycle,
          discountCode: appliedDiscount?.code,
        },
      });

      toast.success(`Paddle checkout geopend voor ${plan.name}!`);
    } catch (error) {
      console.error("Paddle checkout error:", error);
      toast.error(
        "Er ging iets mis met het openen van de checkout. Probeer het opnieuw.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceDisplay = () => {
    if (!plan) return "€0";

    const yearly = billingCycle === "yearly";
    return pricingService.getPriceDisplay(plan, yearly);
  };

  const getSavingsDisplay = () => {
    if (!plan || billingCycle !== "yearly" || plan.price === 0) return null;

    const savings = pricingService.getYearlySavings(plan.price);
    return `Bespaar €${savings} per jaar`;
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-gray-600">Plan details laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                FocusFlow
              </span>
              <p className="text-sm text-gray-500">Upgrade je productiviteit</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/pricing")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Terug naar prijzen</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-800 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Laatste stap</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welkom bij {plan.name}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start je productiviteitsreis met de beste tools en AI-ondersteuning
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Details - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Plan Overview */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-indigo-50/30">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl flex items-center space-x-3">
                    <span>Plan Overzicht</span>
                    {plan.popular && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                        🔥 Populair
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">
                      {plan.name}
                    </h3>
                    <p className="text-lg text-gray-600 mt-2">
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {getPriceDisplay()}
                    </div>
                    {getSavingsDisplay() && (
                      <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">
                        💰 {getSavingsDisplay()}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Billing Cycle Selection */}
                {plan.price > 0 && (
                  <div>
                    <h4 className="font-semibold mb-4 text-gray-900">
                      Kies je facturatiecyclus
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Card
                        className={`cursor-pointer transition-all duration-200 ${
                          billingCycle === "monthly"
                            ? "ring-2 ring-indigo-500 bg-indigo-50"
                            : "hover:shadow-md"
                        }`}
                        onClick={() => setBillingCycle("monthly")}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Maandelijks</div>
                              <div className="text-sm text-gray-500">
                                €{plan.price}/maand
                              </div>
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                billingCycle === "monthly"
                                  ? "bg-indigo-500 border-indigo-500"
                                  : "border-gray-300"
                              }`}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all duration-200 relative ${
                          billingCycle === "yearly"
                            ? "ring-2 ring-indigo-500 bg-indigo-50"
                            : "hover:shadow-md"
                        }`}
                        onClick={() => setBillingCycle("yearly")}
                      >
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          -17%
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Jaarlijks</div>
                              <div className="text-sm text-gray-500">
                                €{pricingService.getYearlyPrice(plan.price)}
                                /jaar
                              </div>
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                billingCycle === "yearly"
                                  ? "bg-indigo-500 border-indigo-500"
                                  : "border-gray-300"
                              }`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Enhanced Features */}
                <div>
                  <h4 className="font-semibold mb-4 text-gray-900">
                    Alles wat je krijgt:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plan.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm"
                      >
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security & Trust */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4 text-gray-900">
                  🔒 Veilig & Betrouwbaar
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">SSL Beveiligd</div>
                      <div className="text-sm text-gray-500">
                        256-bit encryptie
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Lock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Privacy First</div>
                      <div className="text-sm text-gray-500">
                        GDPR compliant
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Veilig Betalen</div>
                      <div className="text-sm text-gray-500">
                        Paddle powered
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div>
                    <p className="text-gray-700 italic mb-3">
                      "FocusFlow heeft mijn productiviteit met 40% verhoogd. De
                      AI coach is ongelooflijk nuttig!"
                    </p>
                    <div className="font-medium">Sarah van der Berg</div>
                    <div className="text-sm text-gray-500">
                      Product Manager bij TechCorp
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Summary - 1 column */}
          <div className="space-y-6">
            <Card className="sticky top-24 shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50/50">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Bestelsamenvatting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{plan.name} plan</span>
                    <span className="font-bold">{getPriceDisplay()}</span>
                  </div>

                  {billingCycle === "yearly" && plan.price > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>💰 Jaarlijkse korting</span>
                      <span className="font-medium">
                        -€{pricingService.getYearlySavings(plan.price)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Totaal</span>
                    <span className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {getPriceDisplay()}
                    </span>
                  </div>
                </div>

                {plan.price === 0 ? (
                  <Button
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    onClick={() => navigate("/dashboard")}
                  >
                    🚀 Gratis Starten
                  </Button>
                ) : (
                  <Button
                    className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                    onClick={handleCheckout}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Paddle laden...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Betaal met Paddle
                      </>
                    )}
                  </Button>
                )}

                <div className="space-y-3 text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>30 dagen geld-terug-garantie</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Cancel op elk moment</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Directe toegang</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h4 className="font-semibold mb-2">Hulp nodig?</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Ons vriendelijke support team staat 24/7 voor je klaar.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/contact")}
                  className="w-full"
                >
                  Contact opnemen
                </Button>
              </CardContent>
            </Card>

            {/* Money Back Guarantee */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">✓</span>
                </div>
                <h4 className="font-semibold text-green-800 mb-2">
                  100% Geld Terug Garantie
                </h4>
                <p className="text-sm text-green-700">
                  Niet tevreden? Krijg binnen 30 dagen je geld volledig terug,
                  geen vragen gesteld.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
