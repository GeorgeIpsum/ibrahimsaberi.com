"use client";

import { useEffect } from "react";

import { cx } from "class-variance-authority";
import { animate, motion } from "framer-motion";

interface WorseProps {
  size?: number;
  fillProps?: {
    bing?: string;
    bingBorder?: string;
    bingAccent?: string;
    bingAccent2?: string;
    bang?: string;
    bangBorder?: string;
  };
}

const addTransitionClasses = (input: string) =>
  cx(input, "transition-all duration-300 ease-in-out");
const addTC = addTransitionClasses;

const Worse: React.FC<WorseProps & { className: string }> = ({
  fillProps,
  size = 100,
  className,
  ...props
}) => {
  const classNameHasSize =
    className?.includes("w-") || className?.includes("h-");
  const {
    bing = addTC("fill-pink-200 dark:fill-emerald-950"),
    bingBorder = addTC("fill-fuchsia-300 dark:fill-emerald-700 delay-300"),
    bingAccent = addTC("fill-fuchsia-950 dark:fill-emerald-50"),
    bingAccent2 = addTC("fill-fuchsia-800 dark:fill-green-400"),
    bang = addTC("fill-[url(#light-is)] delay-300 dark:fill-[url(#dark-is)]"),
    bangBorder = addTC("fill-teal-700 dark:fill-fuchsia-300 delay-300"),
  } = fillProps ?? {};

  return (
    <motion.svg
      id="logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1028 1028"
      strokeWidth={0}
      height={classNameHasSize ? size : undefined}
      width={classNameHasSize ? size : undefined}
      className={cx(
        "fill-slate-50 transition-all duration-700 ease-in-out dark:fill-slate-950",
        className
      )}
      {...props}
    >
      <defs>
        <linearGradient
          id="dark-is"
          x1="475.63"
          y1="104.27"
          x2="532.88"
          y2="687.24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fbcfe8" />
          <stop offset="1" stopColor="#fb7185" />
        </linearGradient>
        <linearGradient
          id="light-is"
          x1="475.63"
          y1="104.27"
          x2="532.88"
          y2="687.24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#022c22" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <g>
        <motion.path
          variants={{
            hidden: {
              pathLength: 0,
              className: "opacity-0",
            },
            visible: {
              pathLength: 1,
              className: bangBorder,
            },
          }}
          initial="hidden"
          animate="visible"
          transition={{
            default: { duration: 5, ease: "easeInOut" },
            fill: { duration: 5, ease: [1, 0, 0.8, 1] },
          }}
          d="M78.65,642.5c-.3-22.71,13.19-61.55,22.59-82.82.11-.25.66.51,3.01-4.52,28.41,321.68,410.9,484.84,666.34,283.1,106.89-84.42,159.05-205.28,155.86-340.32-.05-2.01.07-4.02,0-6.02,4.24-4.95,7.46-10.86,10.54-16.56,10.43-19.33,18.76-39.38,25.6-60.23,22.06,119.22,7.43,231.8-55.72,336.56-164.39,272.72-555.56,296.19-752.93,46.68-25.51-32.24-74.77-116.22-75.29-155.86Z"
        />
        <path
          className={bang}
          d="M926.45,497.94c3.2,135.05-48.97,255.91-155.86,340.32-255.44,201.74-637.93,38.58-666.34-283.1,1.44-3.07,1.4-4.3,1.51-4.52,63.99-131.09,228.28-250.07,378.72-228.89,77.75,10.94,147.89,84.02,95.62,152.84-32.74,43.11-123.35,37.49-141.55,100.89-20.53,71.52,53.07,115.49,113.69,122.73,147.53,17.62,295.06-81.56,374.21-200.28Z"
        />
      </g>
      <g>
        <motion.path
          className={bingBorder}
          d="M962.59,415.11c-6.84,20.85-15.16,40.91-25.6,60.23-5.83-7.61-3.14-26.68-4.52-36.89-6.08-45.01-20.35-84.09-40.66-124.23C740.09,14.36,325.02-6.02,149.42,290.13c-39.94,67.36-64.4,152.46-58.73,231.15.99,13.69,6.21,51.03,10.54,38.4-9.4,21.27-22.89,60.11-22.59,82.82-3.3.03-8.94-20.85-10.54-27.86-32.83-143.37,4.3-300.64,99.39-412.61C383.31-52.09,781.4,8.47,926.45,301.42c14.91,37.02,28.84,74.22,36.14,113.69Z"
        />
        <path
          className={bing}
          d="M885.79,323.26c27.03,56.18,38.35,106.26,40.66,168.66.07,2-.05,4.02,0,6.02-79.15,118.72-226.68,217.9-374.21,200.28-60.62-7.24-134.22-51.21-113.69-122.73,18.2-63.4,108.81-57.78,141.55-100.89,52.27-68.83-17.88-141.9-95.62-152.84-150.44-21.18-314.74,97.8-378.72,228.89-11.22-95.98,9.49-178.35,55.72-262.02,5.37-4.27,24.83-36.02,33.13-45.93C401.78-4.79,764.04,70.19,885.79,323.26Z"
        />
        <path
          className={bingAccent}
          d="M105.75,550.64c-.1.21-.07,1.44-1.51,4.52-2.36,5.03-2.9,4.27-3.01,4.52-4.33,12.63-9.55-24.71-10.54-38.4-5.68-78.69,18.79-163.79,58.73-231.15,7.17,4.5,5.8,3.47,12.05-1.51-46.22,83.67-66.94,166.04-55.72,262.02Z"
        />
        <path
          className={bingAccent}
          d="M891.81,314.22c20.31,40.14,34.58,79.22,40.66,124.23,1.38,10.22-1.31,29.29,4.52,36.89-3.08,5.7-6.3,11.61-10.54,16.56-2.31-62.39-13.63-112.48-40.66-168.66,7.86.85,2.16-2.64,3.01-9.79q1.51.38,3.01.75Z"
        />
        <path
          className={bingAccent2}
          d="M891.81,314.22q-1.51-.38-3.01-.75c-.85,7.14,4.85,10.63-3.01,9.79C764.04,70.19,401.78-4.79,194.6,242.69c-8.3,9.91-27.76,41.66-33.13,45.93-6.25,4.97-4.87,6-12.05,1.51C325.02-6.02,740.09,14.36,891.81,314.22Z"
        />
      </g>
    </motion.svg>
  );
};

export default Worse;
