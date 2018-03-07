FROM trzeci/emscripten

RUN apt-get update && apt-get install -y \
  clang \
  cmake \
  git

ENV ROOT /root/llvm

WORKDIR $ROOT
RUN git clone --depth 1 https://git.llvm.org/git/llvm

WORKDIR $ROOT/llvm/tools
RUN git clone --depth 1 http://llvm.org/git/clang
RUN git clone --depth 1 http://llvm.org/git/lld

WORKDIR $ROOT/build
RUN cmake -G "Unix Makefiles" \
  -DCMAKE_BUILD_TYPE=MinSizeRel \
  -DCMAKE_INSTALL_PREFIX=/opt/llvm-wasm \
  -DLLVM_TARGETS_TO_BUILD=X86 \
  -DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly \
  ../llvm
RUN make -j "$(nproc)"

RUN make install

RUN emsdk update && emsdk install latest

FROM trzeci/emscripten
COPY --from=0 /opt/llvm-wasm /opt/llvm-wasm
COPY --from=0 /emsdk_portable/emscripten/ /emsdk_portable/emscripten/
RUN cp -RT /emsdk_portable/emscripten/*/system/ /emsdk_portable/sdk/system/

RUN sed -ie 's/\/emsdk_portable\/llvm\/clang\/bin/\/opt\/llvm-wasm\/bin/g' /emsdk_portable/data/.config

WORKDIR /src
RUN mkdir tmp && cd tmp && touch a.c && emcc a.c && cd .. && rm -rf tmp
