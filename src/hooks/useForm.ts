import React, { useEffect, useState } from "react";

export function useForm(initial: any, editItem: any) {
  const initialRef = React.useRef(initial);
  const [form, setForm] = useState(() => editItem ?? initial);
  useEffect(() => { setForm(editItem ?? initialRef.current); }, [editItem]);
  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));
  return { form, set };
}
