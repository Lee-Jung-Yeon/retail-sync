import React, { useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Check,
} from "lucide-react";

const SIZES = ["XS", "S", "M", "L", "XL", "FREE"];
const REASON_CATEGORIES = [
  {
    id: "PRICE",
    label: "가격",
    subTags: ["예산 초과", "가성비 아쉬움", "할인율 낮음"],
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    id: "SIZE_FIT",
    label: "사이즈/핏",
    subTags: ["품이 큼", "품이 작음", "기장 김", "기장 짧음", "어깨 안 맞음"],
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    id: "COLOR",
    label: "컬러",
    subTags: ["원톤 안맞음", "채도 아쉬움", "색상 너무 튐"],
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    id: "STYLE_MISMATCH",
    label: "스타일/디자인",
    subTags: ["디테일 부담", "평소 스타일 아님", "유행 지남", "원단/소재 아쉬움"],
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    id: "TIMING",
    label: "시즌/타이밍",
    subTags: ["지금 입기 애매함", "날씨 안맞음", "다음 시즌 대기"],
    color: "bg-teal-100 text-teal-700 border-teal-200",
  },
  {
    id: "COMPARISON",
    label: "타 브랜/상품 비교",
    subTags: ["다른 매장 둘러보기", "온라인이랑 비교", "다른 상품 구매 결정"],
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  {
    id: "COMPANION",
    label: "동행인 의견",
    subTags: ["동행인이 반대함", "조언/추천 못받음"],
    color: "bg-pink-100 text-pink-700 border-pink-200",
  },
  {
    id: "STOCK_OUT",
    label: "재고 품절",
    subTags: ["원하는 사이즈/컬러 없음", "예약 배송 거부"],
    color: "bg-red-100 text-red-700 border-red-200",
  },
];

const ACTIONS = [
  { id: "STOCK_ALARM", label: "입고 알림" },
  { id: "COORD_SUGGEST", label: "코디 제안" },
  { id: "PROMO_MSG", label: "프로모션 안내" },
];

export default function Screen2Fitting({ data, update, onNext, onBack }) {
  const [productCode, setProductCode] = useState(data.product_code || "");
  const [size, setSize] = useState(data.fitting_size || "");
  const [didTryOn, setDidTryOn] = useState(data.did_try_on ?? true);
  const [purchaseResult, setPurchaseResult] = useState(
    data.purchase_result || "",
  );
  const [selectedReasons, setSelectedReasons] = useState(data.reasons || []);
  const [selectedSubTags, setSelectedSubTags] = useState(
    data.sub_reasons || {},
  );
  const [followUp, setFollowUp] = useState(data.follow_up || "");
  const [showWarning, setShowWarning] = useState(false);
  const [showMembershipPopup, setShowMembershipPopup] = useState(false);

  const toggleReason = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );
  };

  const toggleSubTag = (categoryId, subTag) => {
    setSelectedSubTags((prev) => {
      const current = prev[categoryId] || [];
      const updated = current.includes(subTag)
        ? current.filter((t) => t !== subTag)
        : [...current, subTag];
      return { ...prev, [categoryId]: updated };
    });
  };

  const handleNext = () => {
    if (purchaseResult === "PURCHASED" && !productCode) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    if (purchaseResult === "NOT_PURCHASED" && selectedReasons.length === 0) {
      alert("미구매 사유를 최소 1개 이상 선택해주세요.");
      return;
    }

    // 멤버십 가입 유도 팝업 (비멤버 구매 시)
    const isMembershipMember = data.membership_status === "MEMBER";
    if (purchaseResult === "PURCHASED" && !isMembershipMember && !data.membership_joined_at) {
      setShowMembershipPopup(true);
      return;
    }

    proceedToNext();
  };

  const proceedToNext = (joinedMembership = false) => {
    if (joinedMembership) {
      update({ membership_status: "MEMBER", membership_joined_at: new Date().toISOString() });
    }
    update({
      product_code: productCode,
      fitting_size: size,
      did_try_on: didTryOn,
      purchase_result: purchaseResult,
      reasons: selectedReasons,
      sub_reasons: selectedSubTags,
      follow_up: followUp,
    });
    onNext();
  };

  const isPurchased = purchaseResult === "PURCHASED";
  const isNotPurchased = purchaseResult === "NOT_PURCHASED";
  const canProceed =
    purchaseResult &&
    (isPurchased || (isNotPurchased && selectedReasons.length > 0));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Product Selection */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-textPrimary">
              상품 정보
            </h3>
            <button className="flex items-center gap-1 text-[13px] font-semibold text-primary bg-blue-50 px-3 py-1.5 rounded-lg tap-active">
              <Camera size={16} /> 바코드 스캔
            </button>
          </div>
          <div className="relative mb-3">
            <input
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="상품 코드 입력 (선택)"
              className={`w - full h - 14 px - 4 bg - white border - 2 rounded - xl text - [15px] focus: outline - none ${showWarning
                  ? "border-accentRed bg-red-50"
                  : "border-borderGray focus:border-primary"
                } `}
            />
            {showWarning && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-accentRed text-[12px] font-bold">
                코드 필수입력!
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-semibold text-textSecondary">
              피팅 사이즈{" "}
              <span className="text-gray-400 font-normal">(선택)</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-textSecondary">
                피팅룸 이용
              </span>
              <button
                onClick={() => setDidTryOn(!didTryOn)}
                className={`w - 12 h - 6 rounded - full p - 1 transition - colors ${didTryOn ? "bg-primary" : "bg-gray-300"} `}
              >
                <div
                  className={`w - 4 h - 4 rounded - full bg - white transition - transform ${didTryOn ? "translate-x-6" : "translate-x-0"} `}
                />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`h - 11 rounded - lg font - bold text - [13px] transition - all tap - active ${size === s
                    ? "bg-textPrimary text-white shadow-md"
                    : "bg-white border-2 border-borderGray text-textSecondary"
                  } `}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Purchase Result */}
        <section>
          <h3 className="text-[15px] font-bold text-textPrimary mb-3">
            구매 여부 <span className="text-accentRed">*</span>
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setPurchaseResult("PURCHASED");
                setSelectedReasons([]);
              }}
              className={`flex - 1 h - 14 rounded - xl flex items - center justify - center gap - 2 font - bold text - [16px] transition - all tap - active border - 2 ${isPurchased
                  ? "bg-accentGreen border-accentGreen text-white shadow-lg shadow-green-500/30"
                  : "bg-white border-borderGray text-textPrimary"
                } `}
            >
              <span className="text-xl">O</span> 구매함
            </button>
            <button
              onClick={() => setPurchaseResult("NOT_PURCHASED")}
              className={`flex - 1 h - 14 rounded - xl flex items - center justify - center gap - 2 font - bold text - [16px] transition - all tap - active border - 2 ${isNotPurchased
                  ? "bg-accentRed border-accentRed text-white shadow-lg shadow-red-500/30"
                  : "bg-white border-borderGray text-textPrimary"
                } `}
            >
              <span className="text-xl">X</span> 미구매
            </button>
          </div>
        </section>

        {/* Non-Purchase Reasons */}
        {isNotPurchased && (
          <section className="animate-slide-up bg-white p-4 rounded-xl border border-borderGray shadow-sm">
            <h3 className="text-[15px] font-bold text-textPrimary mb-3 flex items-center gap-2">
              미구매 사유 <span className="text-accentRed">*</span>
              <span className="text-[12px] font-normal text-textSecondary bg-gray-100 px-2 py-0.5 rounded-md">
                복수 선택 가능
              </span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {REASON_CATEGORIES.map((rc) => {
                const isSelected = selectedReasons.includes(rc.id);
                return (
                  <button
                    key={rc.id}
                    onClick={() => toggleReason(rc.id)}
                    className={`px - 4 py - 2.5 rounded - full font - bold text - [14px] transition - all tap - active border - 2 flex items - center gap - 1.5 ${isSelected
                        ? `${rc.color} shadow-sm border-transparent`
                        : "bg-white border-borderGray text-textSecondary"
                      } `}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                    {rc.label}
                  </button>
                );
              })}
            </div>

            {/* Sub-tags for selected reasons */}
            {selectedReasons.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-3 animate-slide-up space-y-4">
                <h4 className="text-[13px] font-bold text-gray-500 mb-2">
                  상세 사유 선택 <span className="font-normal">(선택)</span>
                </h4>
                {selectedReasons.map((reasonId) => {
                  const category = REASON_CATEGORIES.find(
                    (rc) => rc.id === reasonId,
                  );
                  if (!category || !category.subTags) return null;

                  return (
                    <div key={category.id}>
                      <span
                        className={`text - [12px] font - bold ${category.color.split(" ")[1]} mb - 1.5 block`}
                      >
                        {category.label}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {category.subTags.map((sub) => {
                          const isSelected = (
                            selectedSubTags[category.id] || []
                          ).includes(sub);
                          return (
                            <button
                              key={sub}
                              onClick={() => toggleSubTag(category.id, sub)}
                              className={`px - 2.5 py - 1.5 rounded - md text - [13px] transition - colors border ${isSelected
                                  ? "bg-textPrimary text-white border-transparent shadow-sm"
                                  : "bg-white text-textSecondary border-gray-300"
                                } `}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Follow-up Action */}
        {isNotPurchased && selectedReasons.length > 0 && (
          <section className="animate-slide-up">
            <h3 className="text-[15px] font-bold text-textPrimary mb-3">
              후속 관리 액션{" "}
              <span className="text-textSecondary font-normal">(선택)</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() =>
                    setFollowUp((prev) => (prev === a.id ? "" : a.id))
                  }
                  className={`h - 12 flex items - center justify - center gap - 1.5 rounded - lg border - 2 font - semibold text - [13px] transition - all tap - active ${followUp === a.id
                      ? "bg-blue-50 border-primary text-primary"
                      : "bg-white border-borderGray text-textSecondary"
                    } `}
                >
                  {followUp === a.id && <MessageSquare size={14} />}
                  {a.label}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="flex p-5 gap-3 bg-white border-t border-borderGray shrink-0">
        <button
          onClick={onBack}
          className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-100 text-textSecondary tap-active"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`flex-1 h-14 rounded-xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all tap-active ${canProceed
              ? "bg-primary text-white shadow-lg shadow-blue-500/30"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
        >
          다음: 취향·메모 <ChevronRight size={20} />
        </button>
      </div>

      {/* Membership Popup */}
      {showMembershipPopup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-80 overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                🌟
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">멤버십 혜택 안내</h3>
              <p className="text-gray-500 text-[14px] leading-relaxed mb-6">
                현재 구매하신 상품에 대해<br />즉시 5% 적립 혜택을 받으실 수 있습니다.<br />멤버십에 가입하시겠습니까?
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowMembershipPopup(false);
                    proceedToNext(true);
                  }}
                  className="w-full h-12 bg-primary text-white font-bold rounded-xl tap-active shadow-lg shadow-blue-500/30"
                >
                  가입하고 포인트 적립
                </button>
                <button
                  onClick={() => {
                    setShowMembershipPopup(false);
                    proceedToNext(false);
                  }}
                  className="w-full h-12 bg-gray-100 text-gray-500 font-semibold rounded-xl tap-active"
                >
                  아니요, 괜찮습니다
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
