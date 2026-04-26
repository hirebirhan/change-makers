import Image from "next/image";
import { Nominee } from "@/types/nominee";
import { useEffect, useState } from "react";

interface NomineeCardProps {
  nominee: Nominee;
  votes: number;
  rank: number;
  percentage: number;
}

export default function NomineeCard({ nominee, votes, rank, percentage }: NomineeCardProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (rank <= 3) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [rank]);

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-[#ffd700] text-yellow-900";
      case 2:
        return "bg-[#c0c0c0] text-gray-900";
      case 3:
        return "bg-[#cd7f32] text-amber-900";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors relative">
      {/* Celebration Particles for top 3 */}
      {rank <= 3 && showCelebration && (
        <>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-sparkle"
                style={{
                  left: `${20 + i * 15}%`,
                  top: '50%',
                  animationDelay: `${i * 0.1}s`,
                  backgroundColor: rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : '#cd7f32',
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Rank Badge */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadgeColor(rank)} ${rank <= 3 ? 'animate-pulse' : ''}`}>
        {rank}
      </div>

      {/* Profile Image */}
      {nominee.profileImageUrl ? (
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image
            src={nominee.profileImageUrl}
            alt={nominee.fullName}
            fill
            sizes="48px"
            className="rounded-full object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-semibold">
          {nominee.fullName.charAt(0)}
        </div>
      )}

      {/* Nominee Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">
          {nominee.fullName}
        </h3>
        {nominee.organization && (
          <p className="text-xs text-gray-500 truncate">{nominee.organization}</p>
        )}
      </div>

      {/* Vote Count & Percentage */}
      <div className="flex-shrink-0 text-right">
        <div className="text-lg font-semibold text-gray-900">{votes.toLocaleString()}</div>
        <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
      </div>

      {/* LinkedIn Link */}
      {nominee.linkedInProfileUrl && (
        <a
          href={nominee.linkedInProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-[#0a66c2] hover:text-[#004182] transition-colors"
          aria-label="LinkedIn Profile"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      )}
    </div>
  );
}
