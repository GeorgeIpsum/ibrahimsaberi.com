const Newthought: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <span
      style={{ fontVariant: "small-caps", letterSpacing: "0.05rem" }}
      className="text-[1.2em]"
    >
      {children}
    </span>
  );
};

export default Newthought;
